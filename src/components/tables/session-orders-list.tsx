"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import { SessionOrdersListSkeleton } from "./session-orders-list-skeleton";

interface SessionOrdersListProps {
  sessionId: string;
}

interface Order {
  id: string;
  createdAt: string;
  amount: number;
  paymentStatus: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
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
    return <SessionOrdersListSkeleton />;
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
    <Card>
      <CardContent className="p-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="py-4 border-b last:border-b-0 space-y-2"
          >
            <div className="flex justify-between">
              <div className="font-medium">
                {new Date(order.createdAt).toLocaleString()}
              </div>
              <Badge
                className={
                  order.paymentStatus === "PAID"
                    ? "bg-green-500/15 text-green-600"
                    : order.paymentStatus === "PENDING"
                      ? "bg-amber-500/15 text-amber-600"
                      : "bg-red-500/15 text-red-600"
                }
              >
                {order.paymentStatus}
              </Badge>
            </div>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-1 mt-2">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm text-muted-foreground"
                  >
                    <div>
                      {item.quantity} x {item.name}
                    </div>
                    <div>{formatCurrency(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-between mt-2">
                <span className="text-sm text-muted-foreground">
                  Order total
                </span>
                <span className="font-medium">
                  {formatCurrency(order.amount)}
                </span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
