"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, AlertTriangle, TrendingUp, ListOrdered } from "lucide-react";
import { InventoryCategoryTable } from "@/components/inventory/category-table";
import { InventoryProductTable } from "@/components/inventory/product-table";
import { StockMovementTable } from "@/components/inventory/stock-movement-table";
import { InventoryReports } from "@/components/inventory/inventory-reports";
import { useInventoryOverview } from "@/hooks/use-inventory";
import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryPage() {
  // Fetch overview data using the hook
  const { data: overviewResponse, isLoading: isLoadingOverview } = useInventoryOverview();
  
  // Extract data from response
  const overviewData = overviewResponse?.data || {
    totalProducts: 0,
    lowStockItems: 0,
    recentMovements: 0,
    pendingOrders: 0
  };
  
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingOverview ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{overviewData.totalProducts}</div>
                    <p className="text-xs text-muted-foreground">
                      Active inventory items
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingOverview ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{overviewData.lowStockItems}</div>
                    <p className="text-xs text-muted-foreground">
                      Items below threshold
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Movements</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingOverview ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{overviewData.recentMovements}</div>
                    <p className="text-xs text-muted-foreground">
                      Recent movements
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <ListOrdered className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingOverview ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{overviewData.pendingOrders}</div>
                    <p className="text-xs text-muted-foreground">
                      Pending orders
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="categories">
          <InventoryCategoryTable />
        </TabsContent>
        <TabsContent value="products">
          <InventoryProductTable />
        </TabsContent>
        <TabsContent value="movements">
          <StockMovementTable />
        </TabsContent>
        <TabsContent value="reports">
          <InventoryReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
