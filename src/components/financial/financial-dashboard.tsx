"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/financial/overview";
import { RecentSales } from "@/components/financial/recent-sales";
import { ExpensesList } from "@/components/financial/expenses-list";
import { ProfitSummary } from "@/components/financial/profit-summary";
import { useFinancial } from "@/hooks/use-financial";

export function FinancialDashboard() {
  const { data, loading, error } = useFinancial();
  
  // Apply defensive programming patterns - use safe defaults
  const safeData = data || {
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    activeTables: 0,
    incomeCategories: [],
    expenseCategories: [],
    recentIncome: [],
    recentExpenses: []
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">...</div>
                <p className="text-xs text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Financial dashboard error:", error);
    // Use safe defaults on error
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground text-red-500">Error loading data</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground text-red-500">Error loading data</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground text-red-500">Error loading data</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground text-red-500">Error loading data</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Safe number formatting with defensive checks
  const formatCurrency = (value: number | undefined | null): string => {
    const safeValue = typeof value === 'number' ? value : 0;
    return '$' + safeValue.toFixed(2);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(safeData.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(safeData.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">+10.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(safeData.netProfit)}</div>
            <p className="text-xs text-muted-foreground">+15.3% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeData.activeTables || 0}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Recent Sales</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="profit">Profit Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Overview data={safeData} isLoading={loading} />
        </TabsContent>
        <TabsContent value="sales" className="space-y-4">
          <RecentSales data={safeData.recentIncome} isLoading={loading} />
        </TabsContent>
        <TabsContent value="expenses" className="space-y-4">
          <ExpensesList data={safeData.recentExpenses} isLoading={loading} />
        </TabsContent>
        <TabsContent value="profit" className="space-y-4">
          <ProfitSummary 
            data={{
              incomeCategories: safeData.incomeCategories,
              expenseCategories: safeData.expenseCategories,
              totalIncome: safeData.totalIncome,
              totalExpenses: safeData.totalExpenses,
              netProfit: safeData.netProfit
            }} 
            isLoading={loading} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 