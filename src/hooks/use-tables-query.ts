"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { TableStatus } from "@prisma/client";

export interface Table {
  id: string;
  companyId: string;
  name: string;
  status: TableStatus;
  hourlyRate: number | null;
  active: boolean;
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

// API functions
const fetchTables = async (params?: {
  companyId?: string;
  status?: TableStatus;
  query?: string;
}) => {
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

  if (!response.ok) {
    throw new Error("Failed to fetch tables");
  }

  return response.json();
};

const fetchTableById = async (tableId: string) => {
  const response = await fetch(`/api/tables/${tableId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch table details");
  }

  return response.json();
};

const createTableApi = async (tableData: TableFormValues) => {
  const response = await fetch("/api/tables", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tableData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create table");
  }

  return response.json();
};

const updateTableApi = async ({
  tableId,
  tableData,
}: {
  tableId: string;
  tableData: Partial<TableFormValues>;
}) => {
  const response = await fetch(`/api/tables/${tableId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tableData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update table");
  }

  return response.json();
};

// React Query Hooks
export function useTablesQuery(params?: {
  companyId?: string;
  status?: TableStatus;
  query?: string;
}) {
  return useQuery({
    queryKey: ["tables", params],
    queryFn: () => fetchTables(params),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useTableByIdQuery(tableId: string) {
  return useQuery({
    queryKey: ["table", tableId],
    queryFn: () => fetchTableById(tableId),
    staleTime: 1000 * 60, // 1 minute
    enabled: !!tableId,
  });
}

export function useCreateTableMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createTableApi,
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Table created successfully",
      });
      // Invalidate all tables queries to ensure data consistency
      queryClient.invalidateQueries({
        queryKey: ["tables"],
      });
      // Also invalidate the specific table query
      queryClient.invalidateQueries({
        queryKey: ["table", data.id],
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create table",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTableMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateTableApi,
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Table updated successfully",
      });
      // Invalidate both the tables list and the specific table
      queryClient.invalidateQueries({
        queryKey: ["tables"],
      });
      queryClient.invalidateQueries({
        queryKey: ["table", data.id],
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update table",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTableMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tableId: string) => {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: false }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete table");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Mesa eliminada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la mesa",
        variant: "destructive",
      });
    },
  });
}
