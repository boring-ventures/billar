"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { TableStatus } from "@prisma/client";

export interface Table {
  id: string;
  companyId: string;
  name: string;
  status: TableStatus;
  hourlyRate: number | null;
  createdAt: Date;
  updatedAt: Date;
  company?: {
    name: string;
  };
  _count?: {
    sessions: number;
    reservations: number;
    maintenances: number;
  };
}

export interface TableFormValues {
  name: string;
  status: TableStatus;
  hourlyRate: string | null;
  companyId: string;
}

export function useTables() {
  const { toast } = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [table, setTable] = useState<Table | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTables = useCallback(
    async (params?: {
      companyId?: string;
      status?: TableStatus;
      query?: string;
    }) => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();

        if (params?.companyId) {
          queryParams.append("companyId", params.companyId);
        }

        if (params?.status) {
          queryParams.append("status", params.status);
        }

        if (params?.query) {
          queryParams.append("query", params.query);
        }

        const response = await fetch(`/api/tables?${queryParams.toString()}`);

        if (response.ok) {
          const data = await response.json();
          setTables(data);
          return data;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to fetch tables",
            variant: "destructive",
          });
          return [];
        }
      } catch (error) {
        console.error("Error fetching tables:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const fetchTableById = useCallback(
    async (tableId: string) => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tables/${tableId}`);

        if (response.ok) {
          const data = await response.json();
          setTable(data);
          return data;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to fetch table details",
            variant: "destructive",
          });
          return null;
        }
      } catch (error) {
        console.error("Error fetching table:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const createTable = useCallback(
    async (tableData: TableFormValues) => {
      try {
        setIsSubmitting(true);
        const response = await fetch("/api/tables", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tableData),
        });

        if (response.ok) {
          const data = await response.json();
          toast({
            title: "Success",
            description: "Table created successfully",
          });
          await fetchTables({ companyId: tableData.companyId });
          return data;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to create table",
            variant: "destructive",
          });
          return null;
        }
      } catch (error) {
        console.error("Error creating table:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchTables, toast]
  );

  const updateTable = useCallback(
    async (tableId: string, tableData: Partial<TableFormValues>) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/tables/${tableId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tableData),
        });

        if (response.ok) {
          const data = await response.json();
          toast({
            title: "Success",
            description: "Table updated successfully",
          });
          // Refresh the table data
          if (table) {
            await fetchTableById(tableId);
          }
          return data;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to update table",
            variant: "destructive",
          });
          return null;
        }
      } catch (error) {
        console.error("Error updating table:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchTableById, table, toast]
  );

  const deleteTable = useCallback(
    async (tableId: string, companyId?: string) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/tables/${tableId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Table deleted successfully",
          });
          // Refresh tables list if we have a company ID
          if (companyId) {
            await fetchTables({ companyId });
          }
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to delete table",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error deleting table:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchTables, toast]
  );

  return {
    tables,
    table,
    isLoading,
    isSubmitting,
    fetchTables,
    fetchTableById,
    createTable,
    updateTable,
    deleteTable,
  };
}
