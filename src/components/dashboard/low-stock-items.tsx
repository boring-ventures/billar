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
import { Loader2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface LowStockItemsProps {
  companyId: string;
}

interface Category {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  criticalThreshold: number;
  price: number;
  category?: Category;
}

export function LowStockItems({ companyId }: LowStockItemsProps) {
  const { data: lowStockItems, isLoading } = useQuery({
    queryKey: ["lowStockItems", companyId],
    queryFn: async () => {
      const response = await fetch(
        `/api/inventory/low-stock?companyId=${companyId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch low stock items");
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
            <TableHead>Artículo</TableHead>
            <TableHead>Nivel</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Precio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lowStockItems && lowStockItems.length > 0 ? (
            lowStockItems.slice(0, 5).map((item: InventoryItem) => {
              const stockPercentage =
                (item.quantity / item.criticalThreshold) * 100;
              const isVeryLow = item.quantity === 0;
              const isLow = item.quantity <= item.criticalThreshold * 0.5;

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {isVeryLow && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span>{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{item.quantity} unidades</span>
                        <span>Min: {item.criticalThreshold}</span>
                      </div>
                      <Progress
                        value={Math.min(stockPercentage, 100)}
                        className={`h-2 ${isVeryLow ? "bg-red-100" : isLow ? "bg-amber-100" : "bg-muted"}`}
                        indicatorClassName={
                          isVeryLow ? "bg-red-500" : isLow ? "bg-amber-500" : ""
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.category?.name || "Sin categoría"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.price || 0)}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No hay artículos con stock bajo.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
