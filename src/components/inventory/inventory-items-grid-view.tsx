"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useInventoryItemsQuery } from "@/hooks/use-inventory-query";
import { useInventoryItems } from "@/hooks/use-inventory-items";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  MoreHorizontal,
  Boxes,
  Plus,
  Minus,
  Edit,
  Trash,
  Eye,
  Power,
  PowerOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { InventoryItemDialog } from "./inventory-item-dialog";
import { StockMovementDialog } from "./stock-movement-dialog";
import { DeleteItemDialog } from "./delete-item-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface InventoryItem {
  id: string;
  companyId: string;
  categoryId: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  criticalThreshold: number;
  price: number | null;
  stockAlerts: boolean;
  lastStockUpdate: string | null;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  category?: {
    id: string;
    name: string;
  };
}

interface InventoryItemsGridViewProps {
  query: string;
  companyId?: string;
  canModify?: boolean;
  itemType?: string;
}

export function InventoryItemsGridView({
  query,
  companyId,
  canModify = false,
  itemType,
}: InventoryItemsGridViewProps) {
  const router = useRouter();
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
    itemType,
  });

  // Get toggle active function
  const { toggleActiveItem } = useInventoryItems({
    companyId: companyId || "",
  });

  // Filter items by search query
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(query.toLowerCase())) ||
      (item.category?.name &&
        item.category.name.toLowerCase().includes(query.toLowerCase()))
  );

  const handleCardClick = (itemId: string) => {
    router.push(`/inventory/${itemId}`);
  };

  const handleEditItem = (
    item: InventoryItem,
    e: React.MouseEvent<HTMLElement>
  ) => {
    e.stopPropagation();
    if (canModify) {
      setEditingItem(item);
      setShowEditDialog(true);
    }
  };

  const handleDeleteItem = (
    item: InventoryItem,
    e: React.MouseEvent<HTMLElement>
  ) => {
    e.stopPropagation();
    if (canModify) {
      setDeleteItem(item);
      setShowDeleteDialog(true);
    }
  };

  const handleToggleActive = async (
    item: InventoryItem,
    e: React.MouseEvent<HTMLElement>
  ) => {
    e.stopPropagation();
    if (canModify) {
      await toggleActiveItem.mutateAsync({
        id: item.id,
        active: !item.active,
      });
    }
  };

  const handleAddStock = (
    item: InventoryItem,
    e: React.MouseEvent<HTMLElement>
  ) => {
    e.stopPropagation();
    if (canModify && item.active) {
      setStockDialogItem(item);
      setStockDialogType("PURCHASE");
      setShowStockDialog(true);
    }
  };

  const handleRemoveStock = (
    item: InventoryItem,
    e: React.MouseEvent<HTMLElement>
  ) => {
    e.stopPropagation();
    if (canModify && item.active) {
      setStockDialogItem(item);
      setStockDialogType("SALE");
      setShowStockDialog(true);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-[120px]" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-[80px]" />
                  <Skeleton className="h-5 w-[50px]" />
                </div>
                <div className="pt-2">
                  <Skeleton className="h-5 w-[100px]" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-4 flex justify-end">
              <Skeleton className="h-9 w-10" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md">
        <Boxes className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium">
          No se encontraron artículos
        </h3>
        <p className="text-muted-foreground mt-1">
          {query
            ? `No hay artículos que coincidan con "${query}"`
            : "Comienza agregando artículos al inventario"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const isLowStock = item.quantity <= item.criticalThreshold;
          return (
            <Card
              key={item.id}
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCardClick(item.id)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-lg truncate">{item.name}</h3>
                  <div className="flex items-center gap-2 ml-2">
                    {isLowStock && (
                      <Badge className="bg-amber-500/15 text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        BAJO
                      </Badge>
                    )}
                    <Badge
                      variant={item.active ? "default" : "secondary"}
                      className={
                        item.active
                          ? "bg-green-500/15 text-green-600"
                          : "bg-gray-500/15 text-gray-600"
                      }
                    >
                      {item.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Categoría</span>
                    <span>{item.category?.name || "Sin categoría"}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SKU</span>
                    <span>{item.sku || "-"}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stock</span>
                    <span
                      className={
                        isLowStock ? "text-amber-600 font-semibold" : ""
                      }
                    >
                      {item.quantity}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Precio</span>
                    <span>{item.price ? formatCurrency(item.price) : "-"}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t p-2 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Abrir menú</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                      <Eye
                        className="mr-2 h-4 w-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(item.id);
                        }}
                      />
                      Ver Detalles
                    </DropdownMenuItem>

                    {canModify && (
                      <>
                        {item.active && (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => handleAddStock(item, e)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Agregar Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleRemoveStock(item, e)}
                            >
                              <Minus className="mr-2 h-4 w-4" />
                              Retirar Stock
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => handleEditItem(item, e)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleToggleActive(item, e)}
                        >
                          {item.active ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Eliminar
                            </>
                          ) : (
                            <>
                              
                            </>
                          )}
                        </DropdownMenuItem>
                        {!item.active && (
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteItem(item, e)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Eliminar Permanentemente
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <InventoryItemDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        item={editingItem}
        companyId={companyId}
        onSuccess={() => setShowEditDialog(false)}
      />

      <StockMovementDialog
        open={showStockDialog}
        onOpenChange={setShowStockDialog}
        item={stockDialogItem}
        type={stockDialogType}
        onSuccess={() => setShowStockDialog(false)}
      />

      <DeleteItemDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        item={deleteItem}
        onSuccess={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
