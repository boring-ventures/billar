"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Table as TableIcon,
  AlertTriangle,
  Loader2,
  ShoppingCart,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryItemsTable } from "@/components/inventory/inventory-items-table";
import { InventoryCategoriesTable } from "@/components/inventory/inventory-categories-table";
import { LowStockItemsTable } from "@/components/inventory/low-stock-items-table";
import { InventoryItemsGridView } from "@/components/inventory/inventory-items-grid-view";
import { InventoryItemDialog } from "@/components/inventory/inventory-item-dialog";
import { InventoryCategoryDialog } from "@/components/inventory/inventory-category-dialog";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile, isLoading: isLoadingProfile } = useCurrentUser();

  const tabParam = searchParams.get("tab");
  const viewParam = searchParams.get("view");

  const [activeTab, setActiveTab] = useState(
    tabParam === "categories"
      ? "categories"
      : tabParam === "low-stock"
        ? "low-stock"
        : tabParam === "internal-use"
          ? "internal-use"
          : "sale"
  );

  const [inventoryView, setInventoryView] = useState(
    viewParam === "grid" ? "grid" : "list"
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // Check if user can modify inventory (ADMIN or SUPERADMIN)
  const canModifyInventory =
    profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";

  // Load company data for the current user
  useEffect(() => {
    const fetchCompanyData = async () => {
      setIsLoadingCompanies(true);
      try {
        // Just fetch to check if the API is working, but don't store the result
        await fetch("/api/companies");
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanyData();
  }, []);

  // Update the tab when URL changes
  useEffect(() => {
    setActiveTab(
      tabParam === "categories"
        ? "categories"
        : tabParam === "low-stock"
          ? "low-stock"
          : tabParam === "internal-use"
            ? "internal-use"
            : "sale"
    );
    setInventoryView(viewParam === "grid" ? "grid" : "list");
  }, [tabParam, viewParam]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "sale") {
      router.push("/inventory");
    } else {
      router.push(`/inventory?tab=${value}`);
    }
  };

  // Update URL when view changes
  const handleViewChange = (view: string) => {
    setInventoryView(view);
    const currentTab = activeTab === "sale" ? "" : `?tab=${activeTab}`;
    const separator = currentTab ? "&" : "?";
    router.push(`/inventory${currentTab}${separator}view=${view}`);
  };

  // Function to handle opening the item dialog
  const handleOpenItemDialog = () => {
    setItemDialogOpen(true);
  };

  // Get the current item type based on active tab
  const getCurrentItemType = () => {
    switch (activeTab) {
      case "sale":
        return "SALE";
      case "internal-use":
        return "INTERNAL_USE";
      default:
        return undefined;
    }
  };

  // Function to render the appropriate content based on active tab
  const renderTabContent = () => {
    const companyId = profile?.companyId as string | undefined;
    const itemType = getCurrentItemType();

    if (activeTab === "categories") {
      return (
        <div className="mt-6">
          <InventoryCategoriesTable
            companyId={companyId}
            searchQuery={searchQuery}
            canModify={canModifyInventory}
          />
        </div>
      );
    } else if (activeTab === "low-stock") {
      return (
        <div className="mt-6">
          <LowStockItemsTable
            companyId={companyId}
            canModify={canModifyInventory}
          />
        </div>
      );
    } else {
      // Handle item type tabs (sale, internal-use)
      if (inventoryView === "list") {
        return (
          <InventoryItemsTable
            companyId={companyId}
            canModify={canModifyInventory}
            itemType={itemType}
          />
        );
      } else {
        return (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Buscar artículos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-[300px]"
                />
              </div>
              <div className="flex space-x-2">
                {canModifyInventory && (
                  <>
                    <Button
                      onClick={handleOpenItemDialog}
                      disabled={isLoadingCompanies || isLoadingProfile}
                    >
                      {isLoadingCompanies && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Añadir Nuevo Artículo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCategoryDialogOpen(true)}
                    >
                      Añadir Categoría
                    </Button>
                  </>
                )}
              </div>
            </div>
            <InventoryItemsGridView
              query={searchQuery}
              companyId={companyId}
              canModify={canModifyInventory}
              itemType={itemType}
            />
          </div>
        );
      }
    }
  };

  // Get tab description based on active tab
  const getTabDescription = () => {
    switch (activeTab) {
      case "sale":
        return "Artículos disponibles para venta a clientes";
      case "internal-use":
        return "Artículos para uso interno (limpieza, mantenimiento, oficina, etc.)";
      case "categories":
        return "Gestiona las categorías de inventario";
      case "low-stock":
        return "Artículos con stock bajo que requieren atención";
      default:
        return "Administra artículos de inventario, categorías y niveles de stock.";
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Gestión de Inventario
        </h2>
        <p className="text-muted-foreground">{getTabDescription()}</p>
      </div>

      <div className="flex justify-between items-center">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full max-w-2xl"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sale" className="flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Venta
            </TabsTrigger>
            <TabsTrigger value="internal-use" className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Uso Interno
            </TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
            <TabsTrigger value="low-stock" className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
              Stock Bajo
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {!["categories", "low-stock"].includes(activeTab) && (
          <div className="flex items-center space-x-2">
            <Button
              variant={inventoryView === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("list")}
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Lista
            </Button>
            <Button
              variant={inventoryView === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("grid")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Cuadrícula
            </Button>
          </div>
        )}
      </div>

      {renderTabContent()}

      <InventoryItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={null}
        onSuccess={() => {
          // Refresh data
        }}
        companyId={profile?.companyId as string | undefined}
        defaultItemType={getCurrentItemType()}
      />

      <InventoryCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={null}
        onSuccess={() => {
          // Refresh data
        }}
        companyId={profile?.companyId as string | undefined}
      />
    </div>
  );
}
