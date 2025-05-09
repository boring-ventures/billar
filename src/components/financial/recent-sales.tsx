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

interface SaleItem {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  status: string;
}

interface RecentSalesProps {
  data: SaleItem[];
  isLoading: boolean;
}

export function RecentSales({ data, isLoading }: RecentSalesProps) {
  // Apply defensive programming from section 7
  const safeData = Array.isArray(data) ? data : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
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
        <CardTitle>Recent Sales</CardTitle>
      </CardHeader>
      <CardContent>
        {safeData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No recent sales data available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeData.map((sale: SaleItem) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.date}</TableCell>
                  <TableCell>{sale.category}</TableCell>
                  <TableCell className="text-right">${Number(sale.amount).toFixed(2)}</TableCell>
                  <TableCell>{sale.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 