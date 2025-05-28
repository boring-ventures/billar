"use client";

import { useParams, useRouter } from "next/navigation";
import { useInventoryItemQuery } from "@/hooks/use-inventory-query";
import { useStockMovements } from "@/hooks/use-stock-movements";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Plus, Minus, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { StockMovementTable } from "@/components/inventory/stock-movement-table";
import { StockMovementDialog } from "@/components/inventory/stock-movement-dialog";
import { InventoryItemDialog } from "@/components/inventory/inventory-item-dialog";
import { ItemDetailsSkeleton } from "@/components/inventory/item-details-skeleton";
import { formatCurrency } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function InventoryItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params?.id as string;
  const [activeTab, setActiveTab] = useState("movements");
  const [stockMovementDialogOpen, setStockMovementDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<
    "PURCHASE" | "SALE" | "ADJUSTMENT"
  >("PURCHASE");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { profile } = useCurrentUser();

  // Check if user can modify inventory (ADMIN or SUPERADMIN)
  const canModify = profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";

  const { data: item, isLoading } = useInventoryItemQuery(itemId);
  const { movements } = useStockMovements(itemId);

  useEffect(() => {
    setEditDialogOpen(false);
    console.log("Edit dialog state reset to false on mount");

    return () => {
      setEditDialogOpen(false);
    };
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleEditItem = () => {
    if (canModify) {
      setEditDialogOpen(true);
    }
  };

  const handleAddStock = () => {
    if (canModify) {
      setMovementType("PURCHASE");
      setStockMovementDialogOpen(true);
    }
  };

  const handleRemoveStock = () => {
    if (canModify) {
      setMovementType("SALE");
      setStockMovementDialogOpen(true);
    }
  };

  const handleAdjustStock = () => {
    if (canModify) {
      setMovementType("ADJUSTMENT");
      setStockMovementDialogOpen(true);
    }
  };

  if (isLoading) {
    return <ItemDetailsSkeleton />;
  }

  if (!item) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Artículo no encontrado
          </h2>
        </div>
        <Button onClick={handleBack} className="mt-4" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  const isLowStock = item.quantity <= item.criticalThreshold;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={handleBack} size="sm" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {item.name}
          </h2>
          <div className="flex items-center gap-2">
            {isLowStock && (
              <Badge className="bg-amber-500/15 text-amber-600">
                STOCK BAJO
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
        {canModify && item.active && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleAddStock} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Stock
            </Button>
            <Button onClick={handleRemoveStock} size="sm" variant="secondary">
              <Minus className="mr-2 h-4 w-4" />
              Retirar Stock
            </Button>
            <Button onClick={handleEditItem} size="sm" variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        )}
        {canModify && !item.active && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleEditItem} size="sm" variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        )}
      </div>

      {isLowStock && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium text-amber-700">Alerta de Stock Bajo</p>
              <p className="text-sm text-amber-600">
                La cantidad actual ({item.quantity}) está en o por debajo del
                límite ({item.criticalThreshold}). Considera reabastecer este
                artículo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Detalles del Artículo</CardTitle>
          <CardDescription>
            Información básica sobre este artículo de inventario
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Categoría
            </p>
            <p>{item.category?.name || "Sin categoría"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">SKU</p>
            <p>{item.sku || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Estado</p>
            <p
              className={
                item.active ? "text-green-600 font-semibold" : "text-gray-600"
              }
            >
              {item.active ? "Activo" : "Inactivo"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Stock Actual
            </p>
            <p className={isLowStock ? "text-amber-600 font-semibold" : ""}>
              {item.quantity} unidades
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Precio</p>
            <p>{item.price ? formatCurrency(item.price) : "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Umbral Crítico
            </p>
            <p>{item.criticalThreshold} unidades</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Alertas de Stock
            </p>
            <p>{item.stockAlerts ? "Habilitadas" : "Deshabilitadas"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Última Actualización
            </p>
            <p>
              {item.lastStockUpdate
                ? new Date(item.lastStockUpdate).toLocaleString()
                : "Nunca"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Creado</p>
            <p>{new Date(item.createdAt).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="movements" className="flex-1">
            Movimientos de Stock
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="flex-1">
            Ajustes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="movements" className="mt-6">
          {canModify && (
            <div className="flex justify-end mb-4">
              <Button size="sm" variant="outline" onClick={handleAdjustStock}>
                Ajuste Manual
              </Button>
            </div>
          )}
          <StockMovementTable
            movements={movements}
            itemId={itemId}
            showAll={true}
          />
        </TabsContent>
        <TabsContent value="adjustments" className="mt-6">
          {canModify && (
            <div className="flex justify-end mb-4">
              <Button size="sm" variant="outline" onClick={handleAdjustStock}>
                Nuevo Ajuste
              </Button>
            </div>
          )}
          <StockMovementTable
            movements={movements.filter((m) => m.type === "ADJUSTMENT")}
            itemId={itemId}
            showAll={false}
          />
        </TabsContent>
      </Tabs>

      <StockMovementDialog
        open={stockMovementDialogOpen}
        onOpenChange={setStockMovementDialogOpen}
        item={item}
        type={movementType}
        onSuccess={() => {
          setStockMovementDialogOpen(false);
        }}
      />

      <InventoryItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={item}
        companyId={item.companyId}
        onSuccess={() => {
          setEditDialogOpen(false);
        }}
      />
    </div>
  );
}
