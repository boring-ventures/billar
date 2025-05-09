"use client";

import { useCallback } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { type Table, type TableStatus } from "@prisma/client";
import { z } from "zod";

// Validation schemas
export const tableFormSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"]),
  hourlyRate: z.coerce.number().optional().nullable(),
  companyId: z.string().uuid().optional(),
});

export const tableStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"]),
  notes: z.string().optional(),
});

export type TableFormValues = z.infer<typeof tableFormSchema>;
export type TableStatusUpdateValues = z.infer<typeof tableStatusSchema>;

export type TableWithDetails = Table & {
  activityLogs: Array<{
    id: string;
    previousStatus: TableStatus;
    newStatus: TableStatus;
    changedAt: Date;
    notes?: string | null;
    changedBy?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  }>;
  maintenances: Array<{
    id: string;
    description: string | null;
    maintenanceAt: Date;
    cost: number | null;
  }>;
  sessions?: Array<{
    id: string;
    startedAt: Date;
    endedAt?: Date | null;
    totalCost?: number | null;
    status: string;
  }>;
};

// Utility functions for API requests
async function fetchTablesList(query?: string) {
  const queryParams = new URLSearchParams();
  if (query) {
    queryParams.append("query", query);
  }
  
  const response = await fetch(`/api/tables?${queryParams.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch tables");
  }
  
  return response.json();
}

async function fetchTableDetails(tableId: string) {
  const response = await fetch(`/api/tables/${tableId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch table details");
  }
  
  return response.json();
}

async function createTableRequest(data: TableFormValues) {
  const response = await fetch("/api/tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create table");
  }
  
  return response.json();
}

async function updateTableRequest(tableId: string, data: Partial<TableFormValues>) {
  const response = await fetch(`/api/tables/${tableId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update table");
  }
  
  return response.json();
}

async function deleteTableRequest(tableId: string) {
  const response = await fetch(`/api/tables/${tableId}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete table");
  }
  
  return response.json();
}

async function updateTableStatusRequest(
  tableId: string, 
  data: TableStatusUpdateValues
) {
  const response = await fetch(`/api/tables/${tableId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update table status");
  }
  
  return response.json();
}

// Custom hooks
export function useTables(searchQuery?: string) {
  const { toast } = useToast();
  
  const {
    data: tables = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tables", searchQuery],
    queryFn: () => fetchTablesList(searchQuery),
    staleTime: 60 * 1000, // 1 minute
  });
  
  // For compatibility with existing components
  const fetchTables = useCallback(
    async (query?: string) => {
      try {
        refetch();
      } catch (e) {
        console.error("Error fetching tables:", e);
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "An unexpected error occurred",
          variant: "destructive",
        });
      }
    },
    [refetch, toast]
  );
  
  return {
    tables,
    isLoading,
    error,
    fetchTables, // For backward compatibility
  };
}

export function useTableDetails(tableId: string | null) {
  const {
    data: tableDetails,
    isLoading: isDetailLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tables", tableId, "details"],
    queryFn: () => (tableId ? fetchTableDetails(tableId) : null),
    enabled: !!tableId,
    staleTime: 60 * 1000, // 1 minute
  });
  
  // For compatibility with existing components
  const fetchTableDetails = useCallback(
    async (id: string) => {
      if (id === tableId) {
        refetch();
      }
    },
    [tableId, refetch]
  );
  
  return {
    tableDetails,
    isDetailLoading,
    error,
    fetchTableDetails, // For backward compatibility
  };
}

export function useCreateTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: createTableRequest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast({
        title: "Success",
        description: "Table created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create table",
        variant: "destructive",
      });
    },
  });
  
  // Backward compatibility wrapper
  const createTable = useCallback(
    async (tableData: TableFormValues) => {
      try {
        await mutation.mutateAsync(tableData);
        return true;
      } catch (error) {
        return false;
      }
    },
    [mutation]
  );
  
  return {
    createTable,
    isSubmitting: mutation.isPending,
    ...mutation,
  };
}

export function useUpdateTable(tableId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (data: Partial<TableFormValues>) => 
      tableId ? updateTableRequest(tableId, data) : Promise.reject("No table ID provided"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      if (tableId) {
        queryClient.invalidateQueries({ queryKey: ["tables", tableId, "details"] });
      }
      toast({
        title: "Success",
        description: "Table updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update table",
        variant: "destructive",
      });
    },
  });
  
  // Backward compatibility wrapper
  const updateTable = useCallback(
    async (id: string, tableData: Partial<TableFormValues>) => {
      try {
        await mutation.mutateAsync(tableData);
        return true;
      } catch (error) {
        return false;
      }
    },
    [mutation]
  );
  
  return {
    updateTable,
    isSubmitting: mutation.isPending,
    ...mutation,
  };
}

export function useDeleteTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: deleteTableRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast({
        title: "Success",
        description: "Table deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete table",
        variant: "destructive",
      });
    },
  });
  
  // Backward compatibility wrapper
  const deleteTable = useCallback(
    async (tableId: string) => {
      try {
        await mutation.mutateAsync(tableId);
        return true;
      } catch (error) {
        return false;
      }
    },
    [mutation]
  );
  
  return {
    deleteTable,
    isSubmitting: mutation.isPending,
    ...mutation,
  };
}

export function useUpdateTableStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: ({ tableId, data }: { tableId: string; data: TableStatusUpdateValues }) =>
      updateTableStatusRequest(tableId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["tables", variables.tableId, "details"] });
      toast({
        title: "Success",
        description: `Table status updated to ${variables.data.status}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update table status",
        variant: "destructive",
      });
    },
  });
  
  // Backward compatibility wrapper
  const updateTableStatus = useCallback(
    async (tableId: string, newStatus: TableStatus, notes?: string) => {
      try {
        await mutation.mutateAsync({
          tableId,
          data: { status: newStatus, notes }
        });
        return true;
      } catch (error) {
        return false;
      }
    },
    [mutation]
  );
  
  return {
    updateTableStatus,
    isSubmitting: mutation.isPending,
    ...mutation,
  };
}
