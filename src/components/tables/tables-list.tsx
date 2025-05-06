"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTables } from "@/hooks/use-tables";
import { useCurrentUser } from "@/hooks/use-current-user";
import { TableStatus } from "@prisma/client";
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

interface TablesListProps {
  searchQuery?: string;
  statusFilter?: TableStatus;
}

export function TablesList({
  searchQuery = "",
  statusFilter,
}: TablesListProps) {
  const router = useRouter();
  const { tables, isLoading, fetchTables } = useTables();
  const { profile } = useCurrentUser();

  const canEditTable =
    profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";

  useEffect(() => {
    fetchTables(searchQuery);
  }, [fetchTables, searchQuery]);

  const handleViewTable = (tableId: string) => {
    router.push(`/tables/${tableId}`);
  };

  const handleEditTable = (tableId: string) => {
    router.push(`/tables/${tableId}/edit`);
  };

  const filteredTables = useMemo(() => {
    return statusFilter
      ? tables.filter((table) => table.status === statusFilter)
      : tables;
  }, [tables, statusFilter]);

  if (isLoading) {
    return <TablesListSkeleton />;
  }

  if (filteredTables.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">
          {tables.length === 0
            ? "No tables found. Create your first table!"
            : "No tables match the current filters."}
        </p>
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
          {filteredTables.map((table) => (
            <TableRow key={table.id}>
              <TableCell className="font-medium">{table.name}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={TABLE_STATUS_COLORS[table.status]}
                >
                  {TABLE_STATUS_LABELS[table.status]}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {table.hourlyRate
                  ? formatCurrency(Number(table.hourlyRate))
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                <TableActions tableId={table.id} isInline />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
