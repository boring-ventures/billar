"use client";

import { useState, useEffect, useCallback } from "react";
import { useCompany } from "@/hooks/use-company";
import { usePosOrders } from "@/hooks/use-pos-orders";
import { useInventoryItems } from "@/hooks/use-inventory-items";
import { useTableSessions } from "@/hooks/use-table-sessions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  MinusCircle,
  PlusCircle,
  Search,
  ShoppingBag,
  Building,
  Trash2,
  RefreshCw,
  Clock,
  Info,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Cart Item interface
interface CartItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  availableQuantity: number;
  isTrackedItem?: boolean; // Whether this item was loaded from tracked items
}

// Company interface
interface Company {
  id: string;
  name: string;
}

interface SessionData {
  id: string;
  startedAt: string;
  endedAt?: string;
  totalCost?: number;
  table?: {
    id: string;
    name: string;
    companyId: string;
    hourlyRate?: number;
  };
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

interface InventoryItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  criticalThreshold?: number;
  currentThreshold?: number;
}

export function NewOrder() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const {
    companies,
    selectedCompany,
    selectedCompanyId,
    setSelectedCompanyId,
    isLoading: isCompanyLoading,
  } = useCompany();
  const { profile } = useCurrentUser();
  const [companyId, setCompanyId] = useState<string>("");
  const isSuperAdmin = profile?.role === "SUPERADMIN";
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(!!sessionId);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [tableSessionId, setTableSessionId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Process tracked items from the session to create a consolidated cart
  const processTrackedItems = useCallback(
    (trackedItems: TrackedItem[], companyId: string) => {
      if (!trackedItems || trackedItems.length === 0 || !companyId) return;

      // Automatically select the session's table
      if (sessionId) {
        setTableSessionId(sessionId);
      }

      // Convert tracked items to cart format
      const cartItems = trackedItems.map((item) => ({
        itemId: item.itemId,
        name: item.item?.name || "Unknown Item",
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        // Don't hardcode availability - it will be calculated dynamically
        availableQuantity: 0, // Will be updated when inventory items load
        isTrackedItem: true,
      }));

      console.log("Setting initial cart from tracked items:", cartItems);
      setCart(cartItems);
    },
    [sessionId, setTableSessionId, setCart]
  );

  // New helper function to process tracked items with inventory data
  const processTrackedItemsWithInventory = useCallback(
    (
      trackedItems: TrackedItem[],
      companyId: string,
      inventoryMap: Map<string, InventoryItem>
    ) => {
      if (!trackedItems || trackedItems.length === 0 || !companyId) return;

      // Automatically select the session's table
      if (sessionId) {
        setTableSessionId(sessionId);
      }

      // Convert tracked items to cart format with correct availability
      const cartItems = trackedItems.map((item) => {
        // Get the current inventory for this item
        const inventoryItem = inventoryMap.get(item.itemId);
        const currentStock = inventoryItem ? inventoryItem.quantity : 0;

        return {
          itemId: item.itemId,
          name: item.item?.name || "Unknown Item",
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          // Set availableQuantity based on current inventory plus what's already tracked
          availableQuantity: currentStock + item.quantity,
          isTrackedItem: true,
        };
      });

      console.log(
        "Setting initial cart from tracked items with inventory data:",
        cartItems
      );
      setCart(cartItems);
    },
    [sessionId, setTableSessionId, setCart]
  );

  // Fetch session data if sessionId is provided in URL
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) {
        setIsSessionLoading(false);
        return;
      }

      setIsSessionLoading(true);
      try {
        const response = await fetch(`/api/table-sessions/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setSessionData(data);

          // If session has a company, automatically set it
          if (data.table?.companyId) {
            setCompanyId(data.table.companyId);
            if (isSuperAdmin) {
              setSelectedCompanyId(data.table.companyId);
            }
          }

          // Fetch tracked items instead of past orders
          const trackedItemsResponse = await fetch(
            `/api/table-sessions/${sessionId}/tracked-items`
          );

          if (trackedItemsResponse.ok) {
            const trackedItems = await trackedItemsResponse.json();

            if (trackedItems && trackedItems.length > 0) {
              console.log("Loaded tracked items:", trackedItems.length);

              // Save the company ID to use for inventory data
              const companyToUse = data.table?.companyId;

              if (companyToUse) {
                // First get inventory data to properly set available quantities
                try {
                  const inventoryResponse = await fetch(
                    `/api/inventory-items?companyId=${companyToUse}`
                  );

                  if (inventoryResponse.ok) {
                    const inventoryItems = await inventoryResponse.json();

                    // Create an inventory map for quick lookups
                    const inventoryMap = new Map<string, InventoryItem>(
                      inventoryItems.map((item: InventoryItem) => [
                        item.id,
                        item,
                      ])
                    );

                    // Now process tracked items with correct inventory data
                    processTrackedItemsWithInventory(
                      trackedItems,
                      companyToUse,
                      inventoryMap
                    );
                  } else {
                    // Fallback to regular processing if inventory fetch fails
                    processTrackedItems(trackedItems, companyToUse);
                  }
                } catch (err) {
                  console.error(
                    "Error fetching inventory for tracked items:",
                    err
                  );
                  // Fallback to regular processing
                  processTrackedItems(trackedItems, companyToUse);
                }
              } else {
                processTrackedItems(trackedItems, data.table?.companyId);
              }
            } else {
              console.log("No tracked items found for this session");
            }
          } else {
            console.error("Failed to fetch tracked items");
          }
        } else {
          console.error("Failed to fetch session data");
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
      } finally {
        setIsSessionLoading(false);
      }
    };

    fetchSessionData();
  }, [
    sessionId,
    isSuperAdmin,
    setSelectedCompanyId,
    processTrackedItems,
    processTrackedItemsWithInventory,
  ]);

  // Use either the selected company from context or manually selected for superadmin
  useEffect(() => {
    if (isSuperAdmin) {
      if (selectedCompanyId && !companyId) {
        setCompanyId(selectedCompanyId);
      }
    } else if (selectedCompany?.id) {
      setCompanyId(selectedCompany.id);
    }
  }, [selectedCompanyId, selectedCompany, isSuperAdmin, companyId]);

  // Hooks
  const { toast } = useToast();
  const { createOrder } = usePosOrders({ companyId });
  const { items, isLoading: isLoadingItems } = useInventoryItems({ companyId });
  const { activeSessions, activeSessionsLoading, refetchActiveSessions } =
    useTableSessions(companyId);

  // Reset cart when company changes
  useEffect(() => {
    if (sessionId) {
      // Don't reset cart if we're loading from a session
      return;
    }
    console.log("Company changed - resetting cart");
    setCart([]);
    setTableSessionId("none");
  }, [companyId, sessionId]);

  // Log cart changes for debugging
  useEffect(() => {
    console.log("Cart updated:", cart);
  }, [cart]);

  // Refetch active sessions when component mounts or company changes
  useEffect(() => {
    if (companyId) {
      refetchActiveSessions();
    }
  }, [companyId, refetchActiveSessions]);

  // Calculate the total
  const cartItemsTotal = cart.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0
  );

  // Add session cost if available
  const sessionCost = sessionData?.totalCost
    ? Number(sessionData.totalCost)
    : 0;
  const cartTotal = cartItemsTotal + sessionCost;

  // Handle company change for superadmin
  const handleCompanyChange = (id: string) => {
    setCompanyId(id);
    if (isSuperAdmin) {
      setSelectedCompanyId(id);
    }
  };

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

    // Check if this item is already tracked in a session
    // This is critically important to maintain inventory integrity
    let actualAvailableQuantity = item.quantity;

    // If we're handling a session with tracked items, we need to consider them already deducted
    // from inventory, so don't double-count them when checking availability
    if (sessionId && tableSessionId === sessionId) {
      // Find if this item is already in the cart as a tracked item
      const trackedItem = cart.find(
        (ci) => ci.itemId === selectedItem && ci.isTrackedItem
      );

      // If tracked, the available quantity is the current inventory + what's already tracked
      // This prevents double counting the deduction
      if (trackedItem) {
        actualAvailableQuantity += trackedItem.quantity;
        console.log(
          `Adjusting available quantity for tracked item ${selectedItem}: inventory=${item.quantity}, tracked=${trackedItem.quantity}, adjusted=${actualAvailableQuantity}`
        );
      }
    }

    let updatedCart = [...cart];

    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      const newQuantity =
        updatedCart[existingItemIndex].quantity + selectedQuantity;

      // Check if we have enough inventory
      if (updatedCart[existingItemIndex].isTrackedItem) {
        // If it's a tracked item, we can add more since it's already accounted for
        // in inventory deductions, up to the adjusted available quantity
        if (newQuantity > actualAvailableQuantity) {
          toast({
            title: "Inventario insuficiente",
            description: `No hay suficiente inventario disponible.`,
            variant: "destructive",
          });
          return;
        }
      } else {
        // Regular item, check against actual inventory
        if (newQuantity > actualAvailableQuantity) {
          toast({
            title: "Inventario insuficiente",
            description: `Inventario insuficiente. Solo ${actualAvailableQuantity} disponible.`,
            variant: "destructive",
          });
          return;
        }
      }

      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: newQuantity,
      };
    } else {
      // Add new item to cart
      if (selectedQuantity > actualAvailableQuantity) {
        toast({
          title: "Inventario insuficiente",
          description: `Inventario insuficiente. Solo ${actualAvailableQuantity} disponible.`,
          variant: "destructive",
        });
        return;
      }

      // Determine if this item is already being tracked
      const isAlreadyTracked = !!cart.find(
        (ci) => ci.itemId === selectedItem && ci.isTrackedItem
      );

      const newCartItem = {
        itemId: item.id,
        name: item.name,
        quantity: selectedQuantity,
        unitPrice: Number(item.price) || 0,
        availableQuantity: actualAvailableQuantity,
        isTrackedItem: isAlreadyTracked, // Mark as tracked if it already exists as tracked
      };

      // Add the new item to cart
      updatedCart = [...updatedCart, newCartItem];

      console.log("Adding new item to cart:", newCartItem);
    }

    // Set the cart state with the updated cart
    console.log("Setting updated cart:", updatedCart);
    setCart(updatedCart);

    // Reset the form
    setSelectedItem("");
    setSelectedQuantity(1);
    setIsAddingItem(false);

    toast({
      title: "Producto añadido",
      description: `${item.name} añadido al carrito`,
    });
  };

  // Update item quantity in cart
  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    const item = cart[index];

    // Validate quantity
    if (newQuantity <= 0) {
      return;
    }

    // For tracked items, we need to adjust the availability calculation
    let effectiveAvailableQuantity = item.availableQuantity;

    // If this is a tracked item, we need to consider the inventory differently
    if (item.isTrackedItem && sessionId) {
      // Find the actual inventory item to get its current quantity
      const inventoryItem = items.find((i) => i.id === item.itemId);
      if (inventoryItem) {
        // For tracked items, available quantity = current inventory + current quantity in cart
        // This prevents double counting the deduction
        effectiveAvailableQuantity = inventoryItem.quantity + item.quantity;
      }
    }

    if (newQuantity > effectiveAvailableQuantity) {
      toast({
        title: "Inventario insuficiente",
        description: `Inventario insuficiente. Solo ${effectiveAvailableQuantity} disponible.`,
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

  // Create a new order
  const handleCreateOrder = async () => {
    if (!companyId) {
      toast({
        title: "Error",
        description: "Please select a company",
        variant: "destructive",
      });
      return;
    }

    // Check for valid items to order
    if (cart.length === 0) {
      // If this is a session payment but there are no items, add a dummy item for the session cost
      if (sessionData?.totalCost && sessionData.totalCost > 0) {
        // Create a special "session payment" item
        const sessionPaymentItem = {
          itemId: "session-payment", // This will be caught and handled specially
          quantity: 1,
          unitPrice: Number(sessionData.totalCost),
        };

        try {
          setIsCreatingOrder(true);

          // Ensure we're using the session ID from the URL if it exists
          const sessionPaymentTableId = sessionId || undefined;

          // Prepare order data with just the session payment
          const sessionPaymentData = {
            companyId,
            tableSessionId: sessionPaymentTableId,
            paymentMethod: paymentMethod as "CASH" | "QR" | "CREDIT_CARD",
            items: [sessionPaymentItem],
          };

          console.log("Submitting session-only payment:", sessionPaymentData);

          const result = await createOrder.mutateAsync(sessionPaymentData);
          console.log("Order created successfully:", result);

          // Show success message and redirect
          toast({
            title: "Success",
            description: "Session payment completed successfully!",
          });

          // Navigate back to tables
          setTimeout(() => {
            router.push(`/tables/${sessionData.table?.id}`);
          }, 1500);

          return;
        } catch (error) {
          console.error("Failed to create session payment:", error);
          toast({
            title: "Error",
            description:
              error instanceof Error
                ? error.message
                : "Failed to create session payment",
            variant: "destructive",
          });
          setIsCreatingOrder(false);
          return;
        }
      } else {
        toast({
          title: "Error",
          description: "Cart is empty. Add items to create an order.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsCreatingOrder(true);

      // Ensure we're using the session ID from the URL if it exists
      const finalTableSessionId =
        sessionId || (tableSessionId !== "none" ? tableSessionId : undefined);

      // Get a clean copy of the cart to ensure we have the latest state
      const currentCart = [...cart];
      console.log("Current cart at order time:", currentCart);

      // Prepare the order items from the current cart
      const orderItems = currentCart.map((item) => {
        // For tracked items, we need to include a flag so the server knows not to double-count inventory
        const isTrackedItem = !!item.isTrackedItem;

        return {
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          isTrackedItem: isTrackedItem,
        };
      });

      // Log the items being included in the order for debugging
      console.log("Items being ordered:", orderItems);

      const orderData = {
        companyId,
        tableSessionId: finalTableSessionId,
        paymentMethod: paymentMethod as "CASH" | "QR" | "CREDIT_CARD",
        items: orderItems,
      };

      // Log the complete order data being sent
      console.log("Submitting order data:", orderData);

      try {
        const response = await fetch("/api/pos-orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Order creation failed with status:", response.status);
          console.error("Error details:", errorData);
          throw new Error(
            errorData.error || `Request failed with status ${response.status}`
          );
        }

        const result = await response.json();
        console.log("Order created successfully:", result);

        // Reset the cart after successful order
        setCart([]);

        // Explicitly invalidate the posOrders query to refresh the order history
        // Force an immediate refetch by setting refetchType to 'active'
        await queryClient.invalidateQueries({
          queryKey: ["posOrders"],
          refetchType: "active",
        });

        // If this is a session closing payment, redirect to tables
        if (sessionData) {
          toast({
            title: "Success",
            description: "Session payment completed successfully!",
          });

          // Navigate back to tables
          setTimeout(() => {
            router.push(`/tables/${sessionData.table?.id}`);
          }, 1500);
        } else {
          toast({
            title: "Success",
            description: "Order created successfully!",
          });

          // Navigate to order history and open the order details popup
          setTimeout(() => {
            // The result contains the created order ID
            const orderId = result?.id;
            if (orderId) {
              router.push(`/pos?tab=history&viewOrder=${orderId}`);
            } else {
              router.push(`/pos?tab=history`);
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Failed to create order:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to create order",
          variant: "destructive",
        });
      } finally {
        setIsCreatingOrder(false);
      }
    } catch (error) {
      console.error("Error preparing order:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to prepare order",
        variant: "destructive",
      });
      setIsCreatingOrder(false);
    }
  };

  // Force the table session selection to match the URL session ID when the component mounts or sessions load
  useEffect(() => {
    if (sessionId && activeSessions && activeSessions.length > 0) {
      // Check if the session from URL exists in the active sessions
      const sessionExists = activeSessions.some(
        (session) => session.id === sessionId
      );

      if (sessionExists) {
        setTableSessionId(sessionId);
        console.log("Setting table session ID to match URL:", sessionId);
      }
    }
  }, [sessionId, activeSessions]);

  // Check if everything is loaded
  const isLoading =
    isCompanyLoading ||
    isSessionLoading ||
    isLoadingItems ||
    (activeSessionsLoading && tableSessionId !== "none");

  // Loading skeleton component
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {isSuperAdmin && (
        <div className="lg:col-span-12">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="lg:col-span-7 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56 mt-2" />
            <div className="mt-4">
              <Skeleton className="h-10 w-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="p-4">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-24 mt-2" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Skeleton className="h-3 w-20 mt-2" />
                      <Skeleton className="h-6 w-16 mt-2" />
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-end">
                      <Skeleton className="h-8 w-28" />
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-5 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
          <CardFooter className="flex-col space-y-4">
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    </div>
  );

  // Return the skeleton if still loading
  if (isLoading) {
    return renderSkeleton();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Company selector for superadmin */}
      {isSuperAdmin && (
        <div className="lg:col-span-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Seleccionar Empresa
              </CardTitle>
              <CardDescription>
                Elija una empresa para ver su inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={companyId} onValueChange={handleCompanyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company: Company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Show session information if available */}
      {sessionData && (
        <div className="lg:col-span-12">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle>Información de Sesión</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Mesa
                  </p>
                  <p className="font-medium">
                    {sessionData.table?.name || "Desconocido"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Duración
                  </p>
                  <p className="font-medium">
                    {formatDuration(
                      new Date(sessionData.endedAt || new Date()).getTime() -
                        new Date(sessionData.startedAt).getTime()
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Costo de Sesión
                  </p>
                  <p className="font-medium">
                    {sessionData.totalCost
                      ? formatCurrency(sessionData.totalCost)
                      : "--"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm">
                La sesión ha terminado y todos los artículos consumidos se han
                añadido a su carrito. Complete el pago para finalizar la
                factura.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Left side - Items */}
      <div className="lg:col-span-7 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventario de Artículos</CardTitle>
            <CardDescription>
              Añada artículos a la orden desde su inventario
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar artículos..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {!companyId ? (
              <div className="text-center py-8 text-muted-foreground">
                {isSuperAdmin
                  ? "Por favor, seleccione una empresa para ver los artículos del inventario"
                  : "No hay empresa seleccionada"}
              </div>
            ) : isLoadingItems ? (
              <div className="text-center py-4">
                Cargando artículos del inventario...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No se encontraron artículos que coincidan con su búsqueda
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <CardTitle className="text-md">{item.name}</CardTitle>
                      <CardDescription>
                        {item.sku ? `SKU: ${item.sku}` : "Sin SKU"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-sm text-muted-foreground">
                        Disponible: {item.quantity}
                      </div>
                      <div className="mt-1 font-bold text-xl">
                        Bs. {Number(item.price).toFixed(2)}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item.id);
                          setSelectedQuantity(1);
                          setIsAddingItem(true);
                        }}
                        disabled={item.quantity <= 0}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Añadir al Pedido
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right side - Cart */}
      <div className="lg:col-span-5 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Orden Actual {selectedCompany && `- ${selectedCompany.name}`}
            </CardTitle>
            <CardDescription>
              Gestiona productos y pagos para esta orden
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cart.length === 0 && !sessionData ? (
              <div className="text-center py-8 text-muted-foreground">
                Su carrito está vacío. Agregue artículos para crear una orden.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">
                      Precio Unitario
                    </TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
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
                        Bs. {item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        Bs. {(item.quantity * item.unitPrice).toFixed(2)}
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

                  {/* Show session cost as a separate line item */}
                  {sessionData &&
                    sessionData.totalCost &&
                    sessionData.totalCost > 0 && (
                      <TableRow className="border-t-2">
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span>
                              Mesa / Sesión ({sessionData.table?.name})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">1</TableCell>
                        <TableCell className="text-right">
                          Bs. {Number(sessionData.totalCost).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          Bs. {Number(sessionData.totalCost).toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="flex-col space-y-4">
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>Bs. {cartTotal.toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mesa / Sesión</label>
                <div className="flex items-center justify-between">
                  <Select
                    value={tableSessionId}
                    onValueChange={(value) => setTableSessionId(value)}
                    disabled={sessionId !== null}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar mesa o sesión" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Sin mesa (venta directa)
                      </SelectItem>
                      {activeSessions?.map((session) => {
                        // Check if table has hourly rate
                        const hourlyRate = session.table?.hourlyRate
                          ? Number(session.table.hourlyRate)
                          : null;

                        return (
                          <SelectItem key={session.id} value={session.id}>
                            {session.table?.name || "Mesa Desconocida"} -
                            Iniciada{" "}
                            {new Date(session.startedAt).toLocaleTimeString()}
                            {hourlyRate ? ` - Bs. ${hourlyRate}/hora` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-2"
                    onClick={() => refetchActiveSessions()}
                    disabled={activeSessionsLoading || !!sessionId} // Disable refresh if we're loading from a session
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${activeSessionsLoading ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Método de Pago</label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Efectivo</SelectItem>
                    <SelectItem value="QR">Pago QR</SelectItem>
                    <SelectItem value="CREDIT_CARD">
                      Tarjeta de Crédito
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="default"
              onClick={handleCreateOrder}
              disabled={cart.length === 0 || isCreatingOrder}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              {isCreatingOrder ? "Procesando..." : "Completar Orden"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Añadir Productos al Carrito</DialogTitle>
            <DialogDescription>
              Busca y añade productos a la orden actual
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Producto Seleccionado
              </label>
              <div id="selected-item" className="font-medium">
                {items.find((i) => i.id === selectedItem)?.name || "Loading..."}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad</label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
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
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedQuantity((q) => q + 1)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Disponible:{" "}
              {items.find((i) => i.id === selectedItem)?.quantity || 0}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingItem(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddToCart}>Añadir al Carrito</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
