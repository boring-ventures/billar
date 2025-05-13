"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { useLowStockItemsQuery } from "@/hooks/use-inventory-query";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Plus,
  ArrowRight,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StockMovementDialog } from "@/components/inventory/stock-movement-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/tables/data-table";
import { TableSkeleton } from "@/components/tables/table-skeleton";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  criticalThreshold: number;
  price: number | null;
  companyId: string;
  categoryId: string | null;
  sku: string | null;
  lastStockUpdate: string | null;
  stockAlerts: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
  };
}

interface LowStockItemsTableProps {
  companyId?: string;
}

export function LowStockItemsTable({ companyId }: LowStockItemsTableProps) {
  const router = useRouter();
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Fetch low stock items
  const { data: items = [], isLoading } = useLowStockItemsQuery(companyId);

  const handleAddStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockDialogOpen(true);
  };

  const handleViewAllItems = () => {
    router.push("/inventory");
  };

  const columns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center font-medium">
            {item.name}
            <Badge className="ml-2 bg-amber-500/15 text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              LOW
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const item = row.original;
        return <div>{item.category?.name || "Uncategorized"}</div>;
      },
    },
    {
      accessorKey: "quantity",
      header: "Current Stock",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-amber-600 font-semibold">{item.quantity}</div>
        );
      },
    },
    {
      accessorKey: "criticalThreshold",
      header: "Threshold",
      cell: ({ row }) => {
        return <div>{row.original.criticalThreshold}</div>;
      },
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const price = row.original.price;
        return <div>{price ? formatCurrency(price) : "-"}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/inventory/${item.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddStock(item)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Stock
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return <TableSkeleton columnCount={6} />;
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center border rounded-md">
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
      </div>
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

      <DataTable
        columns={columns}
        data={items}
        searchPlaceholder="Search low stock items..."
      />

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
