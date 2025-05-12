"use client";

import { useState, useEffect } from "react";
import { DataTable } from "../ui/data-table";
import { TableDialog } from "./table-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableStatus } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTables } from "@/hooks/use-tables";

export function TableList() {
  const { tables, isLoading, isSubmitting, fetchTables, deleteTable } = useTables();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTables(searchQuery);
  }, [searchQuery, fetchTables]);

  const handleAddEdit = (table: Table | null = null) => {
    setSelectedTable(table);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (selectedTable) {
      const success = await deleteTable(selectedTable.id);
      if (success) {
        setIsDeleteAlertOpen(false);
      }
    }
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: Table } }) => {
        const status = row.original.status;
        const variant =
          status === TableStatus.AVAILABLE
            ? "default"
            : status === TableStatus.OCCUPIED
              ? "destructive"
              : status === TableStatus.RESERVED
                ? "secondary"
                : "outline";

        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      accessorKey: "hourlyRate",
      header: "Hourly Rate",
      cell: ({ row }: { row: { original: Table } }) => {
        return <div>${row.original.hourlyRate?.toString() || "0.00"}</div>;
      },
    },
    {
      accessorKey: "companyId",
      header: "Company",
      cell: ({ row }: { row: { original: Table } }) => {
        return <div>{row.original.companyId || "N/A"}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: Table } }) => {
        const table = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleAddEdit(table)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTable(table);
                  setIsDeleteAlertOpen(true);
                }}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <DataTable
        columns={columns}
        data={tables}
        onSearch={setSearchQuery}
        searchPlaceholder="Search tables..."
        onAddNew={() => handleAddEdit()}
        addNewLabel="Add Table"
      />

      <TableDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        table={selectedTable}
        onSuccess={() => fetchTables(searchQuery)}
        isSubmitting={isSubmitting}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              table and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 