"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useLowStockItemsQuery } from "@/hooks/use-inventory-query";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StockMovementDialog } from "@/components/inventory/stock-movement-dialog";
import { Card } from "@/components/ui/card";

interface LowStockItemsTableProps {
  companyId?: string;
}

export function LowStockItemsTable({ companyId }: LowStockItemsTableProps) {
  const router = useRouter();
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fetch low stock items
  const { data: items = [], isLoading } = useLowStockItemsQuery(companyId);

  console.log("Low Stock Items Table - companyId:", companyId);
  console.log("Low Stock Items Table - items:", items);
  console.log("Low Stock Items Table - isLoading:", isLoading);

  const handleRowClick = (itemId: string) => {
    router.push(`/inventory/${itemId}`);
  };

  const handleAddStock = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(item);
    setStockDialogOpen(true);
  };

  const handleViewAllItems = () => {
    router.push("/inventory");
  };

  if (!isLoading && items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="bg-green-100 p-3 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mt-2">All Stock Levels Good</h3>
          <p className="text-muted-foreground">
            No items are currently at or below their critical threshold
          </p>
          <Button
            onClick={handleViewAllItems}
            variant="outline"
            className="mt-4"
          >
            View All Items
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Alert variant="default" className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle>Low Stock Alert</AlertTitle>
        <AlertDescription>
          These items are at or below their critical threshold and need
          attention.
        </AlertDescription>
      </Alert>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading low stock items...
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  onClick={() => handleRowClick(item.id)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {item.name}
                      <Badge className="ml-2 bg-amber-500/15 text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        LOW
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.category?.name || "Uncategorized"}
                  </TableCell>
                  <TableCell className="text-amber-600 font-semibold">
                    {item.quantity}
                  </TableCell>
                  <TableCell>{item.criticalThreshold}</TableCell>
                  <TableCell>
                    {item.price ? formatCurrency(item.price) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={(e) => handleAddStock(item, e)}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Stock
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleViewAllItems}>
          View All Items
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <StockMovementDialog
        open={stockDialogOpen}
        onOpenChange={setStockDialogOpen}
        item={selectedItem}
        type="PURCHASE"
        onSuccess={() => setStockDialogOpen(false)}
      />
    </div>
  );
}
