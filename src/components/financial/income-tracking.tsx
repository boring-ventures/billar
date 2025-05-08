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

const incomeCategories = [
  {
    id: "1",
    name: "Table Rent",
    total: 4500.00,
    percentage: 60,
  },
  {
    id: "2",
    name: "Food & Beverages",
    total: 2500.00,
    percentage: 33,
  },
  {
    id: "3",
    name: "Other Income",
    total: 500.00,
    percentage: 7,
  },
];

const recentIncome = [
  {
    id: "1",
    date: "2024-03-15",
    category: "Table Rent",
    description: "Table 1 - 2 hours",
    amount: 150.00,
    status: "Completed",
  },
  {
    id: "2",
    date: "2024-03-15",
    category: "Food & Beverages",
    description: "Snacks and drinks",
    amount: 75.50,
    status: "Completed",
  },
  {
    id: "3",
    date: "2024-03-14",
    category: "Table Rent",
    description: "Table 2 - 3 hours",
    amount: 180.00,
    status: "Completed",
  },
];

export function IncomeTracking() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {incomeCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${category.total.toFixed(2)}</div>
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
                  {recentIncome.map((income) => (
                    <TableRow key={income.id}>
                      <TableCell>{income.date}</TableCell>
                      <TableCell>{income.category}</TableCell>
                      <TableCell>{income.description}</TableCell>
                      <TableCell className="text-right">${income.amount.toFixed(2)}</TableCell>
                      <TableCell>{income.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell className="text-right">${category.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{category.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 