"use client";

import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePosOrders } from "@/hooks/use-pos-orders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface OrderDetailsDialogProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({
  orderId,
  open,
  onOpenChange,
}: OrderDetailsDialogProps) {
  const { useOrder, updateOrder, getPaymentMethodText, getPaymentStatusText } =
    usePosOrders({
      companyId: "",
    });

  const { data: order, isLoading } = useOrder(orderId);
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdatePayment = async () => {
    if (!order || (!paymentMethod && !paymentStatus)) return;

    setIsUpdating(true);
    try {
      await updateOrder.mutateAsync({
        id: order.id,
        paymentMethod:
          (paymentMethod as "CASH" | "QR" | "CREDIT_CARD") || undefined,
        paymentStatus: (paymentStatus as "PAID" | "UNPAID") || undefined,
      });

      toast({
        title: "Success",
        description: "Order payment updated successfully",
      });
    } catch (error) {
      console.error("Failed to update payment:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || !order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Loading Order Details...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Order #{order.id.substring(0, 8)} created on{" "}
            {format(new Date(order.createdAt), "MMM dd, yyyy 'at' h:mm a")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={
                    order.paymentStatus === "PAID" ? "success" : "default"
                  }
                >
                  {getPaymentStatusText(order.paymentStatus)}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>{getPaymentMethodText(order.paymentMethod)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  {order.tableSession
                    ? order.tableSession.table.name
                    : "No table assigned"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  ${Number(order.amount).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                {order.orderItems.length} items in this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.orderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.item?.name || "Unknown Item"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Number(item.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>Total</div>
              <div className="font-bold">
                ${Number(order.amount).toFixed(2)}
              </div>
            </CardFooter>
          </Card>

          {/* Update Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Update Payment</CardTitle>
              <CardDescription>
                Update payment method or status for this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select
                    defaultValue={order.paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="QR">QR Payment</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select
                    defaultValue={order.paymentStatus}
                    onValueChange={setPaymentStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="UNPAID">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleUpdatePayment}
                disabled={isUpdating || (!paymentMethod && !paymentStatus)}
              >
                {isUpdating ? "Updating..." : "Update Payment"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
