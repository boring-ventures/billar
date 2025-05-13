"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

interface SessionOrdersListProps {
  sessionId: string;
}

interface OrderItem {
  id: string;
  // Add other properties as needed
}

interface Order {
  id: string;
  amount: number;
  paymentStatus: "PAID" | "PENDING" | "FAILED"; // Add other valid statuses as needed
  orderItems?: OrderItem[];
}

export function SessionOrdersList({ sessionId }: SessionOrdersListProps) {
  const { data: session, isLoading } = useQuery({
    queryKey: ["tableSession", sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/table-sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch session details");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading orders...</div>;
  }

  const orders = session?.posOrders || [];

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            No orders placed during this session.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {orders.map((order: Order) => (
            <div
              key={order.id}
              className="flex justify-between items-center p-3 border rounded-md"
            >
              <div>
                <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                <p className="text-sm text-muted-foreground">
                  {order.orderItems?.length || 0} items
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatCurrency(order.amount || 0)}
                </p>
                <p
                  className={`text-xs ${
                    order.paymentStatus === "PAID"
                      ? "text-green-600"
                      : "text-amber-600"
                  }`}
                >
                  {order.paymentStatus}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
