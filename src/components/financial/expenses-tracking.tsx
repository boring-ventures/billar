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

const expenseCategories = [
  {
    id: "1",
    name: "Inventory",
    total: 2500.00,
    percentage: 40,
  },
  {
    id: "2",
    name: "Maintenance",
    total: 1200.00,
    percentage: 20,
  },
  {
    id: "3",
    name: "Staff",
    total: 1500.00,
    percentage: 25,
  },
  {
    id: "4",
    name: "Utilities",
    total: 800.00,
    percentage: 15,
  },
];

const recentExpenses = [
  {
    id: "1",
    date: "2024-03-15",
    category: "Inventory",
    description: "Stock purchase - Snacks",
    amount: 250.00,
    status: "Paid",
  },
  {
    id: "2",
    date: "2024-03-14",
    category: "Maintenance",
    description: "Table repairs",
    amount: 120.00,
    status: "Paid",
  },
  {
    id: "3",
    date: "2024-03-13",
    category: "Utilities",
    description: "Electricity bill",
    amount: 180.50,
    status: "Paid",
  },
];

export function ExpensesTracking() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {expenseCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${category.total.toFixed(2)}</div>
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
                  {recentExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                      <TableCell>{expense.status}</TableCell>
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
              <CardTitle>Expense Categories</CardTitle>
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
                  {expenseCategories.map((category) => (
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