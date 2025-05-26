"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  useInventoryItemsQuery,
  useInventoryCategoriesQuery,
} from "@/hooks/use-inventory-query";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/tables/data-table";
import { TableSkeleton } from "@/components/tables/table-skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Edit,
  Trash,
  Plus,
  Minus,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { InventoryItemDialog } from "@/components/inventory/inventory-item-dialog";
import { StockMovementDialog } from "@/components/inventory/stock-movement-dialog";
import { DeleteItemDialog } from "@/components/inventory/delete-item-dialog";
import { Badge } from "@/components/ui/badge";

interface InventoryItemsTableProps {
  companyId?: string;
  canModify?: boolean;
  itemType?: string;
}

interface InventoryItem {
  id: string;
  companyId: string;
  categoryId: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  criticalThreshold: number;
  price: number | null;
  lastStockUpdate: string | null;
  stockAlerts: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
  };
}

export function InventoryItemsTable({
  companyId,
  canModify = false,
  itemType,
}: InventoryItemsTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined
  );
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [stockDialogType, setStockDialogType] = useState<
    "PURCHASE" | "SALE" | "ADJUSTMENT"
  >("PURCHASE");
  const [stockDialogItem, setStockDialogItem] = useState<InventoryItem | null>(
    null
  );

  // Fetch inventory items
  const { data: items = [], isLoading } = useInventoryItemsQuery({
    companyId,
    categoryId: categoryFilter === "all" ? undefined : categoryFilter,
    itemType,
  });

  // Fetch categories for the filter dropdown
  const { data: categories = [] } = useInventoryCategoriesQuery({
    companyId,
  });

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;

    const lowerQuery = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        (item.sku && item.sku.toLowerCase().includes(lowerQuery)) ||
        (item.category?.name &&
          item.category.name.toLowerCase().includes(lowerQuery))
    );
  }, [items, searchQuery]);

  const handleDialogSuccess = () => {
    // Invalidate and refetch inventory items
    queryClient.invalidateQueries({
      queryKey: ["inventoryItems"],
    });
    setShowEditDialog(false);
  };

  const handleStockDialogSuccess = () => {
    // Invalidate and refetch inventory items
    queryClient.invalidateQueries({
      queryKey: ["inventoryItems"],
    });
    setShowStockDialog(false);
  };

  const handleDeleteDialogSuccess = () => {
    // Invalidate and refetch inventory items
    queryClient.invalidateQueries({
      queryKey: ["inventoryItems"],
    });
    setShowDeleteDialog(false);
  };

  const handleAddNewItem = () => {
    if (canModify) {
      setEditingItem(null);
      setShowEditDialog(true);
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    if (canModify) {
      setEditingItem(item);
      setShowEditDialog(true);
    }
  };

  const handleDeleteItem = (item: InventoryItem) => {
    if (canModify) {
      setDeleteItem(item);
      setShowDeleteDialog(true);
    }
  };

  const handleAddStock = (item: InventoryItem) => {
    if (canModify) {
      setStockDialogItem(item);
      setStockDialogType("PURCHASE");
      setShowStockDialog(true);
    }
  };

  const handleRemoveStock = (item: InventoryItem) => {
    if (canModify) {
      setStockDialogItem(item);
      setStockDialogType("SALE");
      setShowStockDialog(true);
    }
  };

  const columns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => {
        const item = row.original;
        const isLowStock = item.quantity <= item.criticalThreshold;
        return (
          <div className="flex items-center font-medium">
            {item.name}
            {isLowStock && item.stockAlerts && (
              <Badge className="ml-2 bg-amber-500/15 text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                BAJO
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => {
        const sku = row.getValue("sku") as string | null;
        return <div>{sku || "-"}</div>;
      },
    },
    {
      accessorKey: "category",
      header: "Categoría",
      cell: ({ row }) => {
        const item = row.original;
        return <div>{item.category?.name || "Sin categoría"}</div>;
      },
    },
    {
      accessorKey: "quantity",
      header: "Stock",
      cell: ({ row }) => {
        const item = row.original;
        const isLowStock = item.quantity <= item.criticalThreshold;
        return (
          <div
            className={
              isLowStock && item.stockAlerts
                ? "text-amber-600 font-semibold"
                : ""
            }
          >
            {item.quantity}
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Precio",
      cell: ({ row }) => {
        const price = row.getValue("price") as number | null;
        return <div>{price ? formatCurrency(price) : "-"}</div>;
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const item = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/inventory/${item.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalles
              </DropdownMenuItem>

              {canModify && (
                <>
                  <DropdownMenuItem onClick={() => handleAddStock(item)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Stock
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRemoveStock(item)}>
                    <Minus className="mr-2 h-4 w-4" />
                    Retirar Stock
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleEditItem(item)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteItem(item)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return <TableSkeleton columnCount={6} />;
  }

  const categoryFilterElement = (
    <Select
      value={categoryFilter || "all"}
      onValueChange={(value) =>
        setCategoryFilter(value === "all" ? undefined : value)
      }
    >
      <SelectTrigger className="w-full md:w-[180px]">
        <SelectValue placeholder="Todas las Categorías" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas las Categorías</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredItems}
        onSearch={setSearchQuery}
        searchPlaceholder="Buscar artículos..."
        onAddNew={canModify ? handleAddNewItem : undefined}
        addNewLabel="Añadir Nuevo Artículo"
        statusFilter={categoryFilterElement}
      />

      <InventoryItemDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        item={editingItem}
        companyId={companyId}
        onSuccess={handleDialogSuccess}
      />

      <StockMovementDialog
        open={showStockDialog}
        onOpenChange={setShowStockDialog}
        item={stockDialogItem}
        type={stockDialogType}
        onSuccess={handleStockDialogSuccess}
      />

      <DeleteItemDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        item={deleteItem}
        onSuccess={handleDeleteDialogSuccess}
      />
    </>
  );
}
