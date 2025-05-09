"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

// Sample monthly data for trend display
const monthlyProfit = [
  { month: "Jan", profit: 3200 },
  { month: "Feb", profit: 2800 },
  { month: "Mar", profit: 3500 },
  { month: "Apr", profit: 4200 },
  { month: "May", profit: 3800 },
  { month: "Jun", profit: 4500 },
];

interface CategoryItem {
  id: string;
  name: string;
  total: number;
  percentage: number;
}

interface ProfitSummaryProps {
  data: {
    incomeCategories: CategoryItem[];
    expenseCategories: CategoryItem[];
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
  };
  isLoading: boolean;
}

export function ProfitSummary({ data, isLoading }: ProfitSummaryProps) {
  // Apply defensive programming from section 7
  const safeData = data || {
    incomeCategories: [],
    expenseCategories: [],
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0
  };
  
  // Ensure categories are arrays
  const safeIncomeCategories = Array.isArray(safeData.incomeCategories) 
    ? safeData.incomeCategories 
    : [];
  
  const safeExpenseCategories = Array.isArray(safeData.expenseCategories) 
    ? safeData.expenseCategories 
    : [];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              Loading...
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              Loading...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Update the last month's profit with actual data
  const updatedMonthlyProfit = [...monthlyProfit];
  if (updatedMonthlyProfit.length > 0) {
    updatedMonthlyProfit[updatedMonthlyProfit.length - 1].profit = 
      safeData.netProfit > 0 ? safeData.netProfit : updatedMonthlyProfit[updatedMonthlyProfit.length - 1].profit;
  }

  // Format for safe currency display
  const formatCurrency = (value: number): string => {
    return '$' + value.toFixed(2);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Income Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {safeIncomeCategories.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No income data available
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safeIncomeCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {safeIncomeCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Expense Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {safeExpenseCategories.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No expense data available
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safeExpenseCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#FF8042"
                    dataKey="total"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {safeExpenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 