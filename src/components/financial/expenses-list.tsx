"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  status: string;
}

interface ExpensesListProps {
  data: ExpenseItem[];
  isLoading: boolean;
}

export function ExpensesList({ data, isLoading }: ExpensesListProps) {
  // Apply defensive programming from section 7
  const safeData = Array.isArray(data) ? data : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        {safeData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No expense data available
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
              {safeData.map((expense: ExpenseItem) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell className="text-right">${Number(expense.amount).toFixed(2)}</TableCell>
                  <TableCell>{expense.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 