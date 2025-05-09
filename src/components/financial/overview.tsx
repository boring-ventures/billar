"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Sample chart data - will be replaced with real data in future iterations
const sampleData = [
  { name: "Jan", income: 4000, expenses: 2400 },
  { name: "Feb", income: 3000, expenses: 1398 },
  { name: "Mar", income: 2000, expenses: 9800 },
  { name: "Apr", income: 2780, expenses: 3908 },
  { name: "May", income: 1890, expenses: 4800 },
  { name: "Jun", income: 2390, expenses: 3800 },
];

interface OverviewProps {
  data: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    incomeCategories: any[];
    expenseCategories: any[];
    recentIncome: any[];
    recentExpenses: any[];
  };
  isLoading: boolean;
}

export function Overview({ data, isLoading }: OverviewProps) {
  // Apply defensive programming patterns
  const safeData = data || {
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    incomeCategories: [],
    expenseCategories: [],
    recentIncome: [],
    recentExpenses: []
  };

  if (isLoading) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data - using sample data for chart layout, will be replaced with real data
  // This can be expanded in future iterations to show real monthly trends
  const chartData = sampleData.map(item => ({
    ...item,
    // Use actual totals for the last month to give some real data
    ...(item.name === "Jun" ? { 
      income: safeData.totalIncome,
      expenses: safeData.totalExpenses
    } : {})
  }));

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Financial Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#8884d8"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#82ca9d"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 