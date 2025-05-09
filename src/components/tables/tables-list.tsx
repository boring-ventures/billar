"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, TableProperties } from "lucide-react";
import { useTables } from "@/hooks/use-tables";
import { TableStatus, Table as TableModel } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TABLE_STATUS_LABELS, TABLE_STATUS_COLORS } from "@/types/table";
import { formatCurrency } from "@/lib/utils";
import { TableActions } from "./table-actions";
import { TablesListSkeleton } from "./tables-skeleton";
import { Button } from "@/components/ui/button";
import { TableWithNumberRate } from "@/hooks/use-tables";

interface TablesListProps {
  searchQuery?: string;
  statusFilter?: TableStatus | null;
  canAddTable?: boolean;
}

export function TablesList({
  searchQuery = "",
  statusFilter,
  canAddTable = false,
}: TablesListProps) {
  const router = useRouter();
  const { data: tables = [], isLoading } = useTables(searchQuery);

  const handleViewTable = (tableId: string) => {
    router.push(`/tables/${tableId}`);
  };

  const handleCreateTable = () => {
    router.push("/tables/new");
  };

  const filteredTables = useMemo(() => {
    return statusFilter
      ? tables.filter((table: TableModel) => table.status === statusFilter)
      : tables;
  }, [tables, statusFilter]);

  if (isLoading) {
    return <TablesListSkeleton />;
  }

  if (filteredTables.length === 0) {
    return (
      <div className="rounded-md border p-0">
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-8">
            <div className="rounded-full bg-primary/10 p-8">
              <TableProperties className="h-20 w-20 text-primary" />
            </div>
            <div className="space-y-4 max-w-md text-center">
              <h3 className="text-2xl font-semibold">No tables found</h3>
              <p className="text-muted-foreground text-lg mb-6">
                You haven't created any billiard tables yet.
              </p>
              
              {/* Always display the create button */}
              <Button 
                size="lg"
                onClick={handleCreateTable}
                className="px-8 py-6 text-lg bg-primary text-primary-foreground"
              >
                <Plus className="mr-3 h-6 w-6" />
                Create Your First Table
              </Button>
              
              <p className="text-sm text-muted-foreground mt-4">
                Create a table to start managing your billiard business.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground py-4">
              No tables match the current filters.
        </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Hourly Rate</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTables.map((table: TableModel) => {
            const tableWithNumberRate: TableWithNumberRate = {
              ...table,
              hourlyRate: table.hourlyRate ? Number(table.hourlyRate) : null,
            };

            return (
              <TableRow key={table.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewTable(table.id)}>
                <TableCell className="font-medium">{table.name}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={TABLE_STATUS_COLORS[table.status as TableStatus]}
                  >
                    {TABLE_STATUS_LABELS[table.status as TableStatus]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {table.hourlyRate
                    ? formatCurrency(Number(table.hourlyRate))
                    : "—"}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <TableActions table={tableWithNumberRate} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
