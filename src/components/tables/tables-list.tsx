"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TableStatus } from "@prisma/client";
import { useTables } from "@/hooks/use-tables";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Edit,
  Trash,
  Play,
  Pause,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { TABLE_STATUS_LABELS, TABLE_STATUS_COLORS } from "@/types/table";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TablesListProps {
  searchQuery?: string;
  statusFilter?: TableStatus | null;
}

export function TablesList({
  searchQuery = "",
  statusFilter,
}: TablesListProps) {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const { tables, isLoading, fetchTables } = useTables();

  const canEditTable =
    profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";

  useEffect(() => {
    fetchTables(searchQuery);
  }, [fetchTables, searchQuery]);

  // Filter by status if statusFilter is set
  const filteredTables = statusFilter
    ? tables.filter((table) => table.status === statusFilter)
    : tables;

  const handleViewTable = (tableId: string) => {
    router.push(`/tables/${tableId}`);
  };

  const handleEditTable = (tableId: string) => {
    router.push(`/tables/${tableId}/edit`);
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">
                Hourly Rate
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5)
              .fill(0)
              .map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-6 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-28" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (filteredTables.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {searchQuery || statusFilter
            ? "No tables found matching your filters."
            : "No tables have been created yet."}
        </p>
      </div>
    );
  }

  const getStatusAction = (status: TableStatus) => {
    switch (status) {
      case "AVAILABLE":
        return <Play className="h-4 w-4" />;
      case "OCCUPIED":
        return <Pause className="h-4 w-4" />;
      case "RESERVED":
        return <Clock className="h-4 w-4" />;
      case "MAINTENANCE":
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

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
                {table.hourlyRate ? formatCurrency(table.hourlyRate) : "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleViewTable(table.id)}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>

                  {canEditTable && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditTable(table.id)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
