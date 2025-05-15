"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
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
  DollarSign,
  Info,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDuration } from "@/lib/utils";

// Cart Item interface
interface CartItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  availableQuantity: number;
}

// Company interface
interface Company {
  id: string;
  name: string;
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
  } = useCompany();
  const { profile } = useCurrentUser();
  const [companyId, setCompanyId] = useState<string>("");
  const isSuperAdmin = profile?.role === "SUPERADMIN";
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  // Fetch session data if sessionId is provided in URL
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) return;

      setIsLoadingSession(true);
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
              processTrackedItems(trackedItems, data.table?.companyId);
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
        setIsLoadingSession(false);
      }
    };

    fetchSessionData();
  }, [sessionId, isSuperAdmin, setSelectedCompanyId]);

  // Process tracked items from the session to create a consolidated cart
  const processTrackedItems = (trackedItems: any[], companyId: string) => {
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
      availableQuantity: 1000, // Assuming this is available since it was already tracked
    }));

    setCart(cartItems);
  };

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

  // State for the cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableSessionId, setTableSessionId] = useState<string>("none");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Hooks
  const { toast } = useToast();
  const { createOrder } = usePosOrders({ companyId });
  const { items, isLoading: isLoadingItems } = useInventoryItems({ companyId });
  const { activeSessions, activeSessionsLoading, refetchActiveSessions } =
    useTableSessions(companyId);

  // Reset cart when company changes
  useEffect(() => {
    setCart([]);
    setTableSessionId("none");
  }, [companyId]);

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
      description: `${item.name} added to cart`,
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

    if (cart.length === 0 && !sessionData?.totalCost) {
      toast({
        title: "Error",
        description: "Cart is empty. Add items to create an order.",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderData = {
        companyId,
        tableSessionId: tableSessionId !== "none" ? tableSessionId : undefined,
        paymentMethod: paymentMethod as "CASH" | "QR" | "CREDIT_CARD",
        items: cart.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      await createOrder.mutateAsync(orderData);

      // Reset the cart after successful order
      setCart([]);

      // Explicitly invalidate the posOrders query to refresh the order history
      // Force an immediate refetch by setting refetchType to 'active'
      setIsRefreshing(true);
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
          router.push(`/tables/${sessionData.tableId}`);
        }, 1500);
      } else {
        toast({
          title: "Success",
          description: "Order created successfully!",
        });
      }

      setIsRefreshing(false);
    } catch (error) {
      console.error("Failed to create order:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create order",
        variant: "destructive",
      });
      setIsRefreshing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Company selector for superadmin */}
      {isSuperAdmin && (
        <div className="lg:col-span-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Select Company
              </CardTitle>
              <CardDescription>
                Choose a company to view its inventory
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
            <AlertTitle>Session Information</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Table
                  </p>
                  <p className="font-medium">
                    {sessionData.table?.name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Duration
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
                    Session Cost
                  </p>
                  <p className="font-medium">
                    {sessionData.totalCost
                      ? formatCurrency(sessionData.totalCost)
                      : "--"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm">
                Session ended and all consumed items have been added to your
                cart. Complete the payment to finalize the bill.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Left side - Items */}
      <div className="lg:col-span-7 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>
              Add items to the order from your inventory
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search items..."
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
                  ? "Please select a company to view inventory items"
                  : "No company selected"}
              </div>
            ) : isLoadingItems ? (
              <div className="text-center py-4">Loading inventory items...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No items found matching your search
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <CardTitle className="text-md">{item.name}</CardTitle>
                      <CardDescription>
                        {item.sku ? `SKU: ${item.sku}` : "No SKU"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-sm text-muted-foreground">
                        Available: {item.quantity}
                      </div>
                      <div className="mt-1 font-bold text-xl">
                        ${Number(item.price).toFixed(2)}
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
                        Add to Order
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
            <CardTitle className="flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Current Order {selectedCompany && `- ${selectedCompany.name}`}
            </CardTitle>
            <CardDescription>
              {cart.length} {cart.length === 1 ? "item" : "items"} in cart
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cart.length === 0 && !sessionData ? (
              <div className="text-center py-8 text-muted-foreground">
                Your cart is empty. Add items to create an order.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead></TableHead>
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

                  {/* Show session cost as a separate line item */}
                  {sessionData && sessionData.totalCost > 0 && (
                    <TableRow className="border-t-2">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span>Table Session ({sessionData.table?.name})</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">1</TableCell>
                      <TableCell className="text-right">
                        ${Number(sessionData.totalCost).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Number(sessionData.totalCost).toFixed(2)}
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
                <span>${cartTotal.toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="table-session">Table (Optional)</Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => refetchActiveSessions()}
                    disabled={activeSessionsLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${activeSessionsLoading ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
                <Select
                  value={tableSessionId}
                  onValueChange={setTableSessionId}
                  disabled={!companyId}
                >
                  <SelectTrigger id="table-session">
                    <SelectValue placeholder="Select a table session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No table</SelectItem>
                    {activeSessions?.map((session) => {
                      // Calculate current session cost if table has hourly rate
                      const startTime = new Date(session.startedAt);
                      const currentTime = new Date();
                      const durationHours =
                        (currentTime.getTime() - startTime.getTime()) /
                        (1000 * 60 * 60);
                      const hourlyRate = session.table?.hourlyRate
                        ? Number(session.table.hourlyRate)
                        : null;
                      const estimatedCost = hourlyRate
                        ? (durationHours * hourlyRate).toFixed(2)
                        : null;

                      return (
                        <SelectItem key={session.id} value={session.id}>
                          {session.table?.name || "Unknown Table"} - Started{" "}
                          {new Date(session.startedAt).toLocaleTimeString()}
                          {hourlyRate ? ` - $${hourlyRate}/hr` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {/* Display estimated session cost if table is selected */}
                {tableSessionId !== "none" && tableSessionId && (
                  <div className="mt-2 text-sm">
                    {(() => {
                      const session = activeSessions?.find(
                        (s) => s.id === tableSessionId
                      );
                      if (!session) return null;

                      const startTime = new Date(session.startedAt);
                      const currentTime = new Date();
                      const durationHours =
                        (currentTime.getTime() - startTime.getTime()) /
                        (1000 * 60 * 60);
                      const hourlyRate = session.table?.hourlyRate
                        ? Number(session.table.hourlyRate)
                        : null;

                      if (!hourlyRate)
                        return (
                          <p className="text-muted-foreground">
                            No hourly rate set for this table
                          </p>
                        );

                      const estimatedCost = (
                        durationHours * hourlyRate
                      ).toFixed(2);
                      return (
                        <div className="flex flex-col gap-1">
                          <p className="font-medium">Estimated session cost:</p>
                          <p className="text-muted-foreground">
                            {Math.floor(durationHours)}h{" "}
                            {Math.floor((durationHours % 1) * 60)}m at $
                            {hourlyRate}/hr ={" "}
                            <span className="font-medium">
                              ${estimatedCost}
                            </span>
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  disabled={!companyId}
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="QR">QR Payment</SelectItem>
                    <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCreateOrder}
              disabled={
                !companyId ||
                cart.length === 0 ||
                createOrder.isPending ||
                isRefreshing
              }
            >
              {createOrder.isPending || isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {createOrder.isPending
                    ? "Creating Order..."
                    : "Processing..."}
                </>
              ) : (
                "Create Order"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Item to Order</DialogTitle>
            <DialogDescription>
              Specify quantity for the selected item
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="selected-item">Selected Item</Label>
              <div id="selected-item" className="font-medium">
                {items.find((i) => i.id === selectedItem)?.name || "Loading..."}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
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
              Available:{" "}
              {items.find((i) => i.id === selectedItem)?.quantity || 0}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingItem(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToCart}>Add to Cart</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
