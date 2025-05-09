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

interface ExpenseCategory {
  id: string;
  name: string;
  total: number;
  percentage: number;
}

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  status: string;
}

export function ExpensesTracking() {
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
  
  // Ensure categories and expenses are arrays with defensive programming
  const safeExpenseCategories = Array.isArray(safeData.expenseCategories) 
    ? safeData.expenseCategories 
    : [];
    
  const safeRecentExpenses = Array.isArray(safeData.recentExpenses) 
    ? safeData.recentExpenses 
    : [];
  
  // Format currency with defensive formatting
  const formatCurrency = (value: number | undefined | null): string => {
    const safeValue = typeof value === 'number' ? value : 0;
    return '$' + safeValue.toFixed(2);
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
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
    console.error("Error loading expenses data:", error);
    return (
      <div className="p-4 text-red-500">
        Error loading expenses data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {safeExpenseCategories.map((category: ExpenseCategory) => (
          <Card key={category.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(category.total)}</div>
              <p className="text-xs text-muted-foreground">{category.percentage}% of total expenses</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="recent" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="recent">Recent Expenses</TabsTrigger>
            <TabsTrigger value="categories">Expense Categories</TabsTrigger>
          </TabsList>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {safeRecentExpenses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No recent expenses available
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
                    {safeRecentExpenses.map((expense: Expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.date}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(expense.amount))}</TableCell>
                        <TableCell>{expense.status}</TableCell>
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
              <CardTitle>Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {safeExpenseCategories.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No expense categories available
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
                    {safeExpenseCategories.map((category: ExpenseCategory) => (
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