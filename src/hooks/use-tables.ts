"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export const tableStatusUpdateSchema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"]),
  notes: z.string().optional(),
});

export type TableFormValues = z.infer<typeof tableFormSchema>;
export type TableStatusUpdateValues = z.infer<typeof tableStatusUpdateSchema>;

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

export type TableWithNumberRate = Omit<Table, "hourlyRate"> & {
  hourlyRate: number | null;
};

// Utility functions for API requests
async function apiFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'An error occurred');
  }
  
  return response.json();
}

// GET hook
export function useTables(searchQuery?: string) {
  const queryParams = new URLSearchParams();
  if (searchQuery) {
    queryParams.append("query", searchQuery);
  }
  
  return useQuery({
    queryKey: ["tables", searchQuery],
    queryFn: () => apiFetch(`/api/tables?${queryParams.toString()}`),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useTable(id: string) {
  return useQuery({
    queryKey: ["tables", id],
    queryFn: () => apiFetch(`/api/tables/${id}`),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: TableFormValues) => apiFetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useUpdateTable(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<TableFormValues>) => apiFetch(`/api/tables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tables', id] });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/tables/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

// Backward compatibility for existing components
export function useTableDetails(tableId: string | null) {
  const {
    data: tableDetails,
    isLoading: isDetailLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tables", tableId, "details"],
    queryFn: () => (tableId ? apiFetch(`/api/tables/${tableId}`) : null),
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

// Legacy compatibility
export function useUpdateTableStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: ({ tableId, data }: { tableId: string; data: TableStatusUpdateValues }) =>
      apiFetch(`/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["tables", variables.tableId] });
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
