"use client";

import { useState, useEffect } from "react";
import { useCompany } from "@/hooks/use-company";
import { usePosOrders } from "@/hooks/use-pos-orders";
import { useInventoryItems } from "@/hooks/use-inventory-items";
import { useTableSessions } from "@/hooks/use-table-sessions";
import { useCurrentUser } from "@/hooks/use-current-user";
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
import {
  MinusCircle,
  PlusCircle,
  Search,
  ShoppingBag,
  Building,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
  const {
    companies,
    selectedCompany,
    selectedCompanyId,
    setSelectedCompanyId,
  } = useCompany();
  const { profile } = useCurrentUser();
  const [companyId, setCompanyId] = useState<string>("");
  const isSuperAdmin = profile?.role === "SUPERADMIN";

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
  const cartTotal = cart.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0
  );

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

    if (cart.length === 0) {
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
      toast({
        title: "Success",
        description: "Order created successfully!",
      });
    } catch (error) {
      console.error("Failed to create order:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create order",
        variant: "destructive",
      });
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
            {cart.length === 0 ? (
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
                    {activeSessions?.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.table?.name || "Unknown Table"} - Started{" "}
                        {new Date(session.startedAt).toLocaleTimeString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                !companyId || cart.length === 0 || createOrder.isPending
              }
            >
              {createOrder.isPending ? "Creating Order..." : "Create Order"}
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
