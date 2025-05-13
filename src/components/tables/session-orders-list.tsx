"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";

interface SessionOrdersListProps {
  sessionId: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  item: {
    name: string;
  };
}

interface Order {
  id: string;
  amount: number;
  paymentStatus: string;
  createdAt: string;
  orderItems: OrderItem[];
}

export function SessionOrdersList({ sessionId }: SessionOrdersListProps) {
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["sessionOrders", sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/table-sessions/${sessionId}/orders`);
      if (!response.ok) {
        throw new Error("Failed to fetch session orders");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
            <ShoppingCart className="h-10 w-10 opacity-20" />
            <p>No orders found for this session.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="font-medium">Order #{order.id.slice(-8)}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="font-bold text-right">
                  {formatCurrency(order.amount)}
                </p>
                <p className="text-sm text-right">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      order.paymentStatus === "PAID"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <table className="w-full">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left pb-2">Item</th>
                    <th className="text-right pb-2">Qty</th>
                    <th className="text-right pb-2">Price</th>
                    <th className="text-right pb-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems.map((item) => (
                    <tr key={item.id}>
                      <td className="py-1">{item.item.name}</td>
                      <td className="text-right py-1">{item.quantity}</td>
                      <td className="text-right py-1">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="text-right py-1">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
