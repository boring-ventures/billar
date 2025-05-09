"use client";

import { useFinancial } from "@/hooks/use-financial";
import { useInventory } from "@/hooks/use-inventory";
import { usePOS } from "@/hooks/use-pos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, DollarSign, Package, Table2 } from "lucide-react";

export default function DashboardPage() {
  const { data: financialData, loading: financialLoading } = useFinancial();
  const { items: inventoryItems, stockMovements } = useInventory();
  const { tables } = usePOS();

  // Calculate active tables
  const activeTables = tables?.filter(table => table.status === "occupied") || [];
  
  // Get low stock alerts
  const lowStockItems = inventoryItems?.filter(
    item => item.quantity <= item.criticalThreshold
  ) || [];

  // Get recent sales from stock movements
  const recentSales = stockMovements
    ?.filter(movement => movement.type === "SALE")
    .slice(0, 5) || [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialData?.totalIncome.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
            <Table2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTables.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialData?.netProfit.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {lowStockItems.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Alerts</h2>
          {lowStockItems.map((item) => (
            <Alert key={item.id} variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Low Stock Alert</AlertTitle>
              <AlertDescription>
                {item.name} is running low on stock. Current quantity: {item.quantity}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Recent Sales */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Sales</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentSales.map((sale) => (
            <Card key={sale.id}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {sale.item?.name || "Unknown Item"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Quantity: {sale.quantity}
                </div>
                <div className="text-sm text-muted-foreground">
                  Date: {new Date(sale.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Financial Summary</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Income Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {financialData?.incomeCategories.map((category) => (
                  <div key={category.id} className="flex justify-between">
                    <span>{category.name}</span>
                    <span>${category.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {financialData?.expenseCategories.map((category) => (
                  <div key={category.id} className="flex justify-between">
                    <span>{category.name}</span>
                    <span>${category.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 