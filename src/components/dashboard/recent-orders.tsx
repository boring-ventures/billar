"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface RecentOrdersProps {
  companyId: string;
}

export function RecentOrders({ companyId }: RecentOrdersProps) {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["recentOrders", companyId],
    queryFn: async () => {
      const response = await fetch(
        `/api/pos/orders?companyId=${companyId}&limit=5`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch recent orders");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Artículos</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders && orders.length > 0 ? (
            orders.map((order: any) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  #{order.id.substring(0, 8)}
                </TableCell>
                <TableCell>
                  {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell>{order.orderItems?.length || 0} artículos</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      order.paymentStatus === "PAID" ? "default" : "outline"
                    }
                    className={
                      order.paymentStatus === "PAID"
                        ? "bg-green-500 hover:bg-green-600"
                        : ""
                    }
                  >
                    {order.paymentStatus === "PAID" ? "Pagado" : "Pendiente"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(order.amount || 0)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No hay órdenes registradas.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
