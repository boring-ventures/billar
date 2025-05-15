"use client";

import { useState, useEffect } from "react";
import { useInventoryItems } from "@/hooks/use-inventory-items";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
  ShoppingBag,
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

  // Only fetch items when we have a valid company ID
  const { items, isLoading: isLoadingItems } = useInventoryItems({
    companyId: effectiveCompanyId,
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load existing tracked items when component mounts
  useEffect(() => {
    const fetchTrackedItems = async () => {
      if (tableSessionId) {
        try {
          const response = await fetch(
            `/api/table-sessions/${tableSessionId}/tracked-items`
          );

          if (response.ok) {
            const trackedItems = await response.json();
            // Convert tracked items to cart format
            const cartItems = trackedItems.map((item: TrackedItem) => ({
              itemId: item.itemId,
              name: item.item?.name || "Unknown Item",
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              availableQuantity:
                items.find((i) => i.id === item.itemId)?.quantity || 0,
            }));

            setCart(cartItems);
          }
        } catch (error) {
          console.error("Error fetching tracked items:", error);
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

  // Add item to cart
  const handleAddToCart = () => {
    if (!selectedItem || selectedQuantity <= 0) return;

    const item = items.find((i) => i.id === selectedItem);
    if (!item) return;

    // Check if item already in cart
    const existingItemIndex = cart.findIndex(
      (ci) => ci.itemId === selectedItem
    );

    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      const newCart = [...cart];
      const newQuantity =
        newCart[existingItemIndex].quantity + selectedQuantity;

      // Check if we have enough inventory
      if (newQuantity > item.quantity) {
        toast({
          title: "Error",
          description: `Not enough inventory. Only ${item.quantity} available.`,
          variant: "destructive",
        });
        return;
      }

      newCart[existingItemIndex].quantity = newQuantity;
      setCart(newCart);
    } else {
      // Add new item to cart
      if (selectedQuantity > item.quantity) {
        toast({
          title: "Error",
          description: `Not enough inventory. Only ${item.quantity} available.`,
          variant: "destructive",
        });
        return;
      }

      setCart([
        ...cart,
        {
          itemId: item.id,
          name: item.name,
          quantity: selectedQuantity,
          unitPrice: Number(item.price) || 0,
          availableQuantity: item.quantity,
        },
      ]);
    }

    // Reset the form
    setSelectedItem("");
    setSelectedQuantity(1);
    setIsAddingItem(false);

    toast({
      title: "Item Added",
      description: `${item.name} added to tracking list`,
    });
  };

  // Update item quantity in cart
  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    const item = cart[index];

    // Validate quantity
    if (newQuantity <= 0) {
      return;
    }

    if (newQuantity > item.availableQuantity) {
      toast({
        title: "Error",
        description: `Not enough inventory. Only ${item.availableQuantity} available.`,
        variant: "destructive",
      });
      return;
    }

    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    setCart(newCart);
  };

  // Remove item from cart
  const removeCartItem = (index: number) => {
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

      // Invalidate the query to refresh with correct server state
      queryClient.invalidateQueries({
        queryKey: ["trackedItems", tableSessionId],
      });
    } finally {
      setIsRefreshing(false);
    }
  };

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
              <Button onClick={() => setIsAddingItem(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
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
            !effectiveCompanyId
          }
          className="w-full md:w-auto"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>Track Items</>
          )}
        </Button>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Item to Tracking</DialogTitle>
            <DialogDescription>
              Select an item and specify the quantity
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {!isCompanyReady || !effectiveCompanyId ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading company data...</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="item-select">Select Item</Label>
                  <div className="relative flex-grow mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search items..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto border rounded-md p-2">
                    {isLoadingItems ? (
                      <div className="text-center py-4">Loading items...</div>
                    ) : filteredItems.length === 0 ? (
                      <div className="text-center py-4">
                        {searchTerm
                          ? "No items found matching your search"
                          : "No inventory items available for this company"}
                      </div>
                    ) : (
                      filteredItems.map((item) => (
                        <div
                          key={item.id}
                          className={`p-2 border rounded-md cursor-pointer hover:bg-accent ${
                            selectedItem === item.id
                              ? "bg-primary/10 border-primary"
                              : ""
                          }`}
                          onClick={() => setSelectedItem(item.id)}
                        >
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground flex justify-between">
                            <span>Available: {item.quantity}</span>
                            <span>${Number(item.price).toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setSelectedQuantity((q) => Math.max(1, q - 1))
                      }
                      disabled={isLoadingItems}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      className="text-center"
                      value={selectedQuantity}
                      onChange={(e) =>
                        setSelectedQuantity(
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      disabled={isLoadingItems}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedQuantity((q) => q + 1)}
                      disabled={isLoadingItems}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingItem(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddToCart}
              disabled={
                !selectedItem ||
                selectedQuantity <= 0 ||
                isLoadingItems ||
                !isCompanyReady ||
                !effectiveCompanyId
              }
            >
              Add to List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
