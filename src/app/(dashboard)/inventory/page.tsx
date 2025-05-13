"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGrid, Table as TableIcon, AlertTriangle } from "lucide-react";
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
  const { user } = useCurrentUser();

  const tabParam = searchParams.get("tab");
  const viewParam = searchParams.get("view");

  const [activeTab, setActiveTab] = useState(
    tabParam === "categories"
      ? "categories"
      : tabParam === "low-stock"
        ? "low-stock"
        : "items"
  );

  const [inventoryView, setInventoryView] = useState(
    viewParam === "grid" ? "grid" : "list"
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Update the tab when URL changes
  useEffect(() => {
    setActiveTab(
      tabParam === "categories"
        ? "categories"
        : tabParam === "low-stock"
          ? "low-stock"
          : "items"
    );
    setInventoryView(viewParam === "grid" ? "grid" : "list");
  }, [tabParam, viewParam]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "items") {
      router.push("/inventory");
    } else if (value === "categories") {
      router.push("/inventory?tab=categories");
    } else if (value === "low-stock") {
      router.push("/inventory?tab=low-stock");
    }
  };

  // Update URL when view changes
  const handleViewChange = (view: string) => {
    setInventoryView(view);
    if (activeTab === "items") {
      router.push(`/inventory?view=${view}`);
    }
  };

  // Function to render the appropriate content based on active tab
  const renderTabContent = () => {
    if (activeTab === "items") {
      if (inventoryView === "list") {
        return <InventoryItemsTable companyId={user?.companyId} />;
      } else {
        return (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-[300px]"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => setItemDialogOpen(true)}>
                  Add New Item
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCategoryDialogOpen(true)}
                >
                  Add Category
                </Button>
              </div>
            </div>
            <InventoryItemsGridView
              query={searchQuery}
              companyId={user?.companyId}
            />
          </div>
        );
      }
    } else if (activeTab === "categories") {
      return (
        <div className="mt-6">
          
          <InventoryCategoriesTable
            companyId={user?.companyId}
            searchQuery={searchQuery}
          />
        </div>
      );
    } else {
      return (
        <div className="mt-6">
          <LowStockItemsTable companyId={user?.companyId} />
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Inventory Management
        </h2>
        <p className="text-muted-foreground">
          Manage inventory items, categories, and stock levels.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="low-stock" className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
              Low Stock
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "items" && (
          <div className="flex items-center space-x-2">
            <Button
              variant={inventoryView === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("list")}
            >
              <TableIcon className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant={inventoryView === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("grid")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Grid
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
        companyId={user?.companyId}
      />

      <InventoryCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={null}
        onSuccess={() => {
          // Refresh data
        }}
        companyId={user?.companyId}
      />
    </div>
  );
}
