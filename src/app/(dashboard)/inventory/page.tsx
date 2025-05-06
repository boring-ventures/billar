"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryCategoryTable } from "@/components/inventory/category-table";
import { InventoryItemTable } from "@/components/inventory/item-table";
import { StockMovementTable } from "@/components/inventory/stock-movement-table";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam === "items"
      ? "items"
      : tabParam === "stock-movements"
        ? "stock-movements"
        : "categories"
  );

  // Update the tab when URL changes
  useEffect(() => {
    setActiveTab(
      tabParam === "items"
        ? "items"
        : tabParam === "stock-movements"
          ? "stock-movements"
          : "categories"
    );
  }, [tabParam]);

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Inventory Management
        </h2>
        <p className="text-muted-foreground">
          Manage inventory categories, items, and stock movements.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="stock-movements">Stock Movements</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="mt-6">
          <InventoryCategoryTable />
        </TabsContent>
        <TabsContent value="items" className="mt-6">
          <InventoryItemTable />
        </TabsContent>
        <TabsContent value="stock-movements" className="mt-6">
          <StockMovementTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
