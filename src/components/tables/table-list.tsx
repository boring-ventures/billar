"use client";

import { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableStatus } from "@prisma/client";
import { useTables } from "@/hooks/use-tables";

export function TableList() {
  const { tables, isLoading, fetchTables } = useTables();

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Button>Add Table</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Hourly Rate</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tables.map((table) => (
            <TableRow key={table.id}>
              <TableCell>{table.name}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    table.status === TableStatus.AVAILABLE
                      ? "default"
                      : table.status === TableStatus.OCCUPIED
                      ? "destructive"
                      : table.status === TableStatus.RESERVED
                      ? "secondary"
                      : "outline"
                  }
                >
                  {table.status}
                </Badge>
              </TableCell>
              <TableCell>
                {table.hourlyRate ? `$${table.hourlyRate.toString()}` : "-"}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 