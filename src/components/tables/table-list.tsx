"use client";

import { useEffect, useState } from "react";
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
import { TableDialog } from "./table-dialog";

export function TableList() {
  const { tables, isLoading, isSubmitting, fetchTables } = useTables();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<ReturnType<typeof useTables>["tables"][number] | null>(null);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleAddEdit = (table: ReturnType<typeof useTables>["tables"][number] | null = null) => {
    setSelectedTable(table);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Button onClick={() => handleAddEdit()}>Add Table</Button>
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
                <Button variant="ghost" size="sm" onClick={() => handleAddEdit(table)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TableDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        table={selectedTable}
        onSuccess={() => fetchTables()}
        isSubmitting={isSubmitting}
      />
    </div>
  );
} 