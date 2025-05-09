"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useFinancial } from "@/hooks/use-financial";

interface IncomeCategory {
  id: string;
  name: string;
  total: number;
  percentage: number;
}

interface Income {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  status: string;
}

export function IncomeTracking() {
  // Use the financial data hook to get real data from the API
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
  
  // Ensure categories and income are arrays with defensive programming
  const safeIncomeCategories = Array.isArray(safeData.incomeCategories) 
    ? safeData.incomeCategories 
    : [];
    
  const safeRecentIncome = Array.isArray(safeData.recentIncome) 
    ? safeData.recentIncome 
    : [];
  
  // Format currency with defensive formatting
  const formatCurrency = (value: number | undefined | null): string => {
    const safeValue = typeof value === 'number' ? value : 0;
    return '$' + safeValue.toFixed(2);
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
    console.error("Error loading income data:", error);
    return (
      <div className="p-4 text-red-500">
        Error loading income data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {safeIncomeCategories.map((category: IncomeCategory) => (
          <Card key={category.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(category.total)}</div>
              <p className="text-xs text-muted-foreground">{category.percentage}% of total income</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="recent" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="recent">Recent Income</TabsTrigger>
            <TabsTrigger value="categories">Income Categories</TabsTrigger>
          </TabsList>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Income
          </Button>
        </div>
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Income Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {safeRecentIncome.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No recent income available
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeRecentIncome.map((income: Income) => (
                      <TableRow key={income.id}>
                        <TableCell>{income.date}</TableCell>
                        <TableCell>{income.category}</TableCell>
                        <TableCell>{income.description}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(income.amount))}</TableCell>
                        <TableCell>{income.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {safeIncomeCategories.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No income categories available
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeIncomeCategories.map((category: IncomeCategory) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(category.total))}</TableCell>
                        <TableCell className="text-right">{category.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 