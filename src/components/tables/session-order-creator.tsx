"use client";

import { useState, useEffect } from "react";
import { useInventoryItems } from "@/hooks/use-inventory-items";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  MinusCircle,
  PlusCircle,
  Search,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CartItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  availableQuantity: number;
}

interface TrackedItem {
  id: string;
  tableSessionId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  item?: {
    name: string;
    price: number;
  };
}

interface SessionOrderCreatorProps {
  tableSessionId: string;
  tableId: string;
  companyId: string;
}

export function SessionOrderCreator({
  tableSessionId,
  companyId,
}: SessionOrderCreatorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCompanyReady, setIsCompanyReady] = useState(false);
  const [effectiveCompanyId, setEffectiveCompanyId] =
    useState<string>(companyId);
  const [forceRefreshKey, setForceRefreshKey] = useState(0);
  const [isStockUpdating, setIsStockUpdating] = useState(false);

  // Fetch session details to ensure we have the correct company ID
  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const response = await fetch(`/api/table-sessions/${tableSessionId}`);
        if (response.ok) {
          const sessionData = await response.json();

          // Check for company ID in various locations
          const extractedCompanyId =
            sessionData.table?.company?.id ||
            sessionData.table?.companyId ||
            "";

          if (extractedCompanyId) {
            console.log("Found company ID:", extractedCompanyId);
            setEffectiveCompanyId(extractedCompanyId);
          } else {
            console.warn("No company ID found in session data:", sessionData);
          }
        }
      } catch (error) {
        console.error("Error fetching session details:", error);
      } finally {
        setIsCompanyReady(true);
      }
    };

    if (!companyId || companyId === "") {
      fetchSessionDetails();
    } else {
      setEffectiveCompanyId(companyId);
      setIsCompanyReady(true);
    }
  }, [tableSessionId, companyId]);

  // When component mounts or company ID changes, ensure we have the latest inventory data
  useEffect(() => {
    if (effectiveCompanyId) {
      // Invalidate inventory queries to ensure we have fresh data
      queryClient.invalidateQueries({
        queryKey: ["inventoryItems", effectiveCompanyId],
      });
    }
  }, [effectiveCompanyId, queryClient]);

  // Only fetch items when we have a valid company ID
  const { items, isLoading: isInventoryLoading } = useInventoryItems({
    companyId: effectiveCompanyId,
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTrackedItemsLoading, setIsTrackedItemsLoading] = useState(true);

  // Calculate if inventory is updating based on available loading state
  const isInventoryUpdating = isInventoryLoading;

  // Setup timer to periodically refresh inventory data
  useEffect(() => {
    if (!effectiveCompanyId) return;

    // Refresh immediately on mount
    queryClient.invalidateQueries({
      queryKey: ["inventoryItems"],
      refetchType: "all",
    });

    // Set up a timer to refresh inventory data every 2 seconds
    const intervalId = setInterval(() => {
      console.log("Periodic inventory refresh");
      // Increment refresh key to force component update
      setForceRefreshKey((prev) => prev + 1);
      // Force refresh of inventory data
      queryClient.invalidateQueries({
        queryKey: ["inventoryItems"],
        refetchType: "all",
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [effectiveCompanyId, queryClient]);

  // Load existing tracked items when component mounts
  useEffect(() => {
    const fetchTrackedItems = async () => {
      if (tableSessionId) {
        setIsTrackedItemsLoading(true);
        try {
          const response = await fetch(
            `/api/table-sessions/${tableSessionId}/tracked-items`
          );

          if (response.ok) {
            const trackedItems = await response.json();
            // Don't populate cart with existing tracked items
            // Just log them for reference
            console.log(`Found ${trackedItems.length} existing tracked items`);
          }
        } catch (error) {
          console.error("Error fetching tracked items:", error);
        } finally {
          setIsTrackedItemsLoading(false);
        }
      }
    };

    if (tableSessionId && isCompanyReady && items.length > 0) {
      fetchTrackedItems();
    }
  }, [tableSessionId, isCompanyReady, items]);

  // Calculate the total
  const cartTotal = cart.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0
  );

  // Debug output for company and items
  useEffect(() => {
    console.log("Current companyId:", effectiveCompanyId);
    console.log("Items loaded:", items.length);
  }, [effectiveCompanyId, items]);

  // Filter items by search term
  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      (item.sku && item.sku.toLowerCase().includes(searchLower))
    );
  });

  // Calculate adjusted available quantity considering cart items
  const getAdjustedAvailableQuantity = (
    itemId: string,
    stockQuantity: number
  ): number => {
    // Find if this item is already in the cart
    const cartItem = cart.find((item) => item.itemId === itemId);
    if (cartItem) {
      // Subtract the quantity in cart from available stock
      return stockQuantity - cartItem.quantity;
    }
    return stockQuantity;
  };

  // Get the total in-cart quantity for an item excluding a specific cart entry
  const getOtherCartQuantity = (
    itemId: string,
    excludeIndex: number = -1
  ): number => {
    return cart.reduce((total, item, idx) => {
      if (item.itemId === itemId && idx !== excludeIndex) {
        return total + item.quantity;
      }
      return total;
    }, 0);
  };

  // Add item to cart
  const handleAddToCart = () => {
    if (!selectedItem || selectedQuantity <= 0) return;

    const item = items.find((i) => i.id === selectedItem);
    if (!item) return;

    // Get quantity of this item already in cart
    const otherCartQuantity = getOtherCartQuantity(selectedItem);

    // Calculate real available stock
    const realAvailableStock = item.quantity - otherCartQuantity;

    // Check if item already in cart
    const existingItemIndex = cart.findIndex(
      (ci) => ci.itemId === selectedItem
    );

    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      const newCart = [...cart];
      const newQuantity =
        newCart[existingItemIndex].quantity + selectedQuantity;

      // Check if we have enough inventory using adjusted quantity
      if (selectedQuantity > realAvailableStock) {
        toast({
          title: "Inventario insuficiente",
          description: `Solo hay ${realAvailableStock} unidades disponibles de ${item.name}.`,
          variant: "destructive",
        });
        return;
      }

      newCart[existingItemIndex].quantity = newQuantity;

      // Update availableQuantity in cart item - calculate based on new total quantity
      newCart[existingItemIndex].availableQuantity = Math.max(
        0,
        item.quantity -
          newQuantity -
          otherCartQuantity +
          newCart[existingItemIndex].quantity
      );

      // Optimistically update inventory items in the UI
      queryClient.setQueryData(
        ["inventoryItems", effectiveCompanyId],
        (oldItems: typeof items = []) => {
          return oldItems.map((inventoryItem) => {
            if (inventoryItem.id === selectedItem) {
              return {
                ...inventoryItem,
                quantity: Math.max(
                  0,
                  inventoryItem.quantity - selectedQuantity
                ),
              };
            }
            return inventoryItem;
          });
        }
      );

      setCart(newCart);
    } else {
      // Add new item to cart
      if (selectedQuantity > realAvailableStock) {
        toast({
          title: "Inventario insuficiente",
          description: `Solo hay ${realAvailableStock} unidades disponibles de ${item.name}.`,
          variant: "destructive",
        });
        return;
      }

      // Calculate updated available quantity based on real available stock
      const updatedAvailableQuantity = realAvailableStock - selectedQuantity;

      // Optimistically update inventory items in the UI
      queryClient.setQueryData(
        ["inventoryItems", effectiveCompanyId],
        (oldItems: typeof items = []) => {
          return oldItems.map((inventoryItem) => {
            if (inventoryItem.id === selectedItem) {
              return {
                ...inventoryItem,
                quantity: updatedAvailableQuantity,
              };
            }
            return inventoryItem;
          });
        }
      );

      setCart([
        ...cart,
        {
          itemId: item.id,
          name: item.name,
          quantity: selectedQuantity,
          unitPrice: Number(item.price) || 0,
          availableQuantity: updatedAvailableQuantity,
        },
      ]);
    }

    // Reset the form
    setSelectedItem("");
    setSelectedQuantity(1);
    setIsAddingItem(false);

    toast({
      title: "Artículo agregado",
      description: `${item.name} agregado a la lista de seguimiento`,
    });
  };

  // Update item quantity in cart
  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    const item = cart[index];
    const currentQuantity = item.quantity;

    // Validate quantity
    if (newQuantity <= 0) {
      return;
    }

    // Find the actual inventory item
    const inventoryItem = items.find((i) => i.id === item.itemId);
    if (!inventoryItem) return;

    // Calculate the difference we're trying to add
    const quantityDifference = newQuantity - currentQuantity;

    // If we're increasing the quantity, check if we have enough stock
    if (quantityDifference > 0) {
      // Get quantity of this item in other cart entries
      const otherCartQuantity = getOtherCartQuantity(item.itemId, index);

      // Calculate real available stock (total - other cart items)
      const realAvailableStock = inventoryItem.quantity - otherCartQuantity;

      if (newQuantity > currentQuantity + realAvailableStock) {
        toast({
          title: "Inventario insuficiente",
          description: `Solo hay ${currentQuantity + realAvailableStock} unidades disponibles de ${item.name}.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Update inventory in UI
    queryClient.setQueryData(
      ["inventoryItems", effectiveCompanyId],
      (oldItems: typeof items = []) => {
        return oldItems.map((inventoryItem) => {
          if (inventoryItem.id === item.itemId) {
            // If increasing quantity, decrease inventory
            // If decreasing quantity, increase inventory
            return {
              ...inventoryItem,
              quantity: inventoryItem.quantity - quantityDifference,
            };
          }
          return inventoryItem;
        });
      }
    );

    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    // Update available quantity
    newCart[index].availableQuantity =
      item.availableQuantity - quantityDifference;
    setCart(newCart);
  };

  // Remove item from cart
  const removeCartItem = (index: number) => {
    const itemToRemove = cart[index];

    // Return quantity to inventory in UI
    queryClient.setQueryData(
      ["inventoryItems", effectiveCompanyId],
      (oldItems: typeof items = []) => {
        return oldItems.map((inventoryItem) => {
          if (inventoryItem.id === itemToRemove.itemId) {
            return {
              ...inventoryItem,
              quantity: inventoryItem.quantity + itemToRemove.quantity,
            };
          }
          return inventoryItem;
        });
      }
    );

    setCart(cart.filter((_, i) => i !== index));
  };

  // Track items in the cart instead of creating an order
  const handleTrackItems = async () => {
    if (!effectiveCompanyId) {
      toast({
        title: "Error",
        description: "Company ID is missing",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "No items to track",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRefreshing(true);
      setIsTrackedItemsLoading(true);

      // Prepare the items to track
      const itemsToTrack = cart.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

      // Save current cart for optimistic update
      const currentCartItems = [...cart];

      // Clear cart immediately for optimistic UI update
      setCart([]);

      // Optimistic update to query cache
      queryClient.setQueryData(
        ["trackedItems", tableSessionId],
        (old: TrackedItem[] = []) => {
          // Map the cart items to the format of tracked items
          const result = [...old];

          // Process each item to merge with existing items or add new ones
          currentCartItems.forEach((item) => {
            // Check if this item already exists in tracked items
            const existingItemIndex = result.findIndex(
              (existingItem) => existingItem.itemId === item.itemId
            );

            if (existingItemIndex >= 0) {
              // If exists, update the quantity instead of adding a new entry
              result[existingItemIndex] = {
                ...result[existingItemIndex],
                quantity: result[existingItemIndex].quantity + item.quantity,
              };
            } else {
              // If not exists, add as a new item with a temporary ID
              result.push({
                id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Ensure ID uniqueness
                tableSessionId: tableSessionId,
                itemId: item.itemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                item: {
                  name: item.name,
                  price: item.unitPrice,
                },
              });
            }
          });

          return result;
        }
      );

      // Optimistically update inventory quantities in the UI
      queryClient.setQueryData(
        ["inventoryItems", effectiveCompanyId],
        (oldItems: typeof items = []) => {
          return oldItems.map((item) => {
            // Find if this item is in our cart
            const cartItem = currentCartItems.find(
              (ci) => ci.itemId === item.id
            );
            if (cartItem) {
              // Decrease the stock count
              return {
                ...item,
                quantity: Math.max(0, item.quantity - cartItem.quantity),
              };
            }
            return item;
          });
        }
      );

      // Show success toast
      toast({
        title: "Success",
        description: "Items tracked for this session successfully!",
      });

      // Actually make the API request
      const response = await fetch(
        `/api/table-sessions/${tableSessionId}/tracked-items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items: itemsToTrack }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to track items");
      }

      // Get the real data from the server
      const result = await response.json();

      // Update with real server data
      queryClient.setQueryData(
        ["trackedItems", tableSessionId],
        (old: TrackedItem[] = []) => {
          // Remove our temporary items
          const filteredOld = old.filter(
            (item) => !item.id.toString().startsWith("temp-")
          );

          // Process the server response to merge with existing items
          const finalResult = [...filteredOld];

          // Add the server-returned items
          result.forEach((serverItem: TrackedItem) => {
            // Check if this item already exists
            const existingIndex = finalResult.findIndex(
              (item) => item.id === serverItem.id
            );

            if (existingIndex >= 0) {
              // Replace with server data
              finalResult[existingIndex] = serverItem;
            } else {
              // Add new item
              finalResult.push(serverItem);
            }
          });

          return finalResult;
        }
      );

      // Force a refresh of the inventory data to ensure stock counts are up-to-date
      queryClient.invalidateQueries({
        queryKey: ["inventoryItems", effectiveCompanyId],
      });

      // Also invalidate any other inventory-related queries
      queryClient.invalidateQueries({
        queryKey: ["inventoryItems"],
      });
    } catch (error) {
      console.error("Failed to track items:", error);

      // Show error toast
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to track items",
        variant: "destructive",
      });

      // Revert cart if there was an error
      setCart(cart);

      // Revert the optimistic inventory update
      queryClient.invalidateQueries({
        queryKey: ["inventoryItems", effectiveCompanyId],
      });

      // Invalidate the query to refresh with correct server state
      queryClient.invalidateQueries({
        queryKey: ["trackedItems", tableSessionId],
      });
    } finally {
      setIsRefreshing(false);
      setIsTrackedItemsLoading(false);
    }
  };

  // Listen for the specific inventory updating state from the tracked items component
  useEffect(() => {
    const checkStockUpdateState = () => {
      const isUpdating =
        queryClient.getQueryData(["inventory-updating-state"]) === true;
      setIsStockUpdating(isUpdating);
    };

    // Check initially
    checkStockUpdateState();

    // Set up interval to check periodically
    const intervalId = setInterval(checkStockUpdateState, 200);

    return () => clearInterval(intervalId);
  }, [queryClient]);

  return (
    <div className="space-y-6">
      <div>
        {!isCompanyReady || !effectiveCompanyId ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">
              Loading company data...
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search inventory items..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                onClick={() => setIsAddingItem(true)}
                disabled={
                  isTrackedItemsLoading ||
                  isRefreshing ||
                  isInventoryUpdating ||
                  isStockUpdating
                }
              >
                {isTrackedItemsLoading ||
                isInventoryUpdating ||
                isStockUpdating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {isStockUpdating
                      ? "Esperando actualización de stock..."
                      : isInventoryUpdating
                        ? "Actualizando inventario..."
                        : "Loading..."}
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Item
                  </>
                )}
              </Button>
            </div>

            <div className="border rounded-md">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No items tracked yet. Search and add items to track for this
                  session.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                updateCartItemQuantity(index, item.quantity - 1)
                              }
                            >
                              <MinusCircle className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                updateCartItemQuantity(index, item.quantity + 1)
                              }
                            >
                              <PlusCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeCartItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-xl font-semibold">
          Total: ${cartTotal.toFixed(2)}
        </div>
        <Button
          onClick={handleTrackItems}
          disabled={
            cart.length === 0 ||
            isRefreshing ||
            !isCompanyReady ||
            !effectiveCompanyId ||
            isInventoryUpdating ||
            isStockUpdating
          }
          className="w-full md:w-auto"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isInventoryUpdating || isStockUpdating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {isStockUpdating
                ? "Esperando actualización de stock..."
                : "Actualizando inventario..."}
            </>
          ) : (
            <>Track Items</>
          )}
        </Button>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Agregar Artículo</DialogTitle>
            <DialogDescription>
              Agrega artículos a la sesión para realizar seguimiento.
            </DialogDescription>
          </DialogHeader>
          {isTrackedItemsLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Cargando datos de inventario...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar artículos..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Item Selection - Card Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto py-2 px-1">
                {filteredItems.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No se encontraron artículos que coincidan con la búsqueda.
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = selectedItem === item.id;
                    const availableQty = getAdjustedAvailableQuantity(
                      item.id,
                      item.quantity
                    );
                    const isLowStock = availableQty <= item.criticalThreshold;

                    return (
                      <div
                        key={item.id}
                        className={
                          isSelected
                            ? "border rounded-md p-4 border-primary bg-primary/10 cursor-pointer transition-colors"
                            : "border rounded-md p-4 hover:border-primary/50 cursor-pointer transition-colors"
                        }
                        onClick={() => setSelectedItem(item.id)}
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.sku ? `SKU: ${item.sku}` : "Sin SKU"}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm font-medium">
                            ${Number(item.price).toFixed(2)}
                          </span>
                          <span
                            className={
                              isLowStock
                                ? "text-sm text-red-500"
                                : "text-sm text-green-600"
                            }
                          >
                            Stock: {availableQty}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quantity Selection */}
              {selectedItem && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">
                    {items.find((i) => i.id === selectedItem)?.name || ""}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="quantity-input">Cantidad</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedQuantity(
                              Math.max(1, selectedQuantity - 1)
                            )
                          }
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Input
                          id="quantity-input"
                          type="number"
                          min={1}
                          value={selectedQuantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              setSelectedQuantity(val);
                            }
                          }}
                          className="w-20 text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedQuantity(selectedQuantity + 1)
                          }
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>

                        <div className="ml-2 text-sm text-muted-foreground">
                          Disponible:{" "}
                          {(() => {
                            const availableQty = getAdjustedAvailableQuantity(
                              selectedItem,
                              items.find((i) => i.id === selectedItem)
                                ?.quantity || 0
                            );
                            const isOverLimit = availableQty < selectedQuantity;

                            return (
                              <span
                                className={
                                  isOverLimit
                                    ? "text-red-500 font-medium"
                                    : "text-green-600 font-medium"
                                }
                              >
                                {availableQty} unidades
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {(() => {
                        const availableQty = getAdjustedAvailableQuantity(
                          selectedItem,
                          items.find((i) => i.id === selectedItem)?.quantity ||
                            0
                        );

                        if (availableQty < selectedQuantity) {
                          return (
                            <p className="text-red-500 text-sm mt-1">
                              ¡Cantidad seleccionada mayor que el stock
                              disponible!
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="text-sm">
                      <span className="font-medium">Subtotal:</span> $
                      {(
                        (items.find((i) => i.id === selectedItem)?.price || 0) *
                        selectedQuantity
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddingItem(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={
                !selectedItem ||
                selectedQuantity <= 0 ||
                isTrackedItemsLoading ||
                !!(
                  selectedItem &&
                  getAdjustedAvailableQuantity(
                    selectedItem,
                    items.find((i) => i.id === selectedItem)?.quantity || 0
                  ) < selectedQuantity
                )
              }
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
