"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { SessionStatus } from "@prisma/client";

export interface TableSession {
  id: string;
  tableId: string;
  staffId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  totalCost: number | null;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
  table?: {
    id: string;
    name: string;
    companyId: string;
    company?: {
      name: string;
    };
  };
  staff?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  posOrders?: Array<{
    id: string;
    amount: number;
    paymentStatus: string;
  }>;
}

// API functions
const fetchTableSessions = async (params?: {
  tableId?: string;
  companyId?: string;
  status?: SessionStatus;
}) => {
  const queryParams = new URLSearchParams();

  if (params?.tableId) {
    queryParams.append("tableId", params.tableId);
  }

  if (params?.companyId) {
    queryParams.append("companyId", params.companyId);
  }

  if (params?.status) {
    queryParams.append("status", params.status);
  }

  const response = await fetch(`/api/table-sessions?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch table sessions");
  }

  return response.json();
};

const fetchSessionById = async (sessionId: string) => {
  const response = await fetch(`/api/table-sessions/${sessionId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch session details");
  }

  return response.json();
};

const createTableSessionApi = async ({
  tableId,
  staffId,
  staffNotes,
  startedAt,
}: {
  tableId: string;
  staffId?: string;
  staffNotes?: string;
  startedAt?: string;
}) => {
  const response = await fetch("/api/table-sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tableId, staffId, staffNotes, startedAt }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start table session");
  }

  return response.json();
};

const endTableSessionApi = async (sessionId: string, endedAt?: string) => {
  const response = await fetch(`/api/table-sessions/${sessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ endSession: true, endedAt }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to end table session");
  }

  return response.json();
};

const updateSessionStatusApi = async ({
  sessionId,
  status,
}: {
  sessionId: string;
  status: SessionStatus;
}) => {
  const response = await fetch(`/api/table-sessions/${sessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update session status");
  }

  return response.json();
};

const deleteTableSessionApi = async (sessionId: string) => {
  const response = await fetch(`/api/table-sessions/${sessionId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete session");
  }

  return response.json();
};

const moveTableSessionApi = async ({
  sessionId,
  targetTableId,
}: {
  sessionId: string;
  targetTableId: string;
}) => {
  const response = await fetch(`/api/table-sessions/${sessionId}/move`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ targetTableId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to move table session");
  }

  return response.json();
};

// React Query Hooks
export function useTableSessionsQuery(params?: {
  tableId?: string;
  companyId?: string;
  status?: SessionStatus;
}) {
  return useQuery({
    queryKey: ["tableSessions", params],
    queryFn: () => fetchTableSessions(params),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useTableSessionByIdQuery(sessionId: string) {
  return useQuery({
    queryKey: ["tableSession", sessionId],
    queryFn: () => fetchSessionById(sessionId),
    staleTime: 1000 * 30, // 30 seconds
    enabled: !!sessionId,
  });
}

export function useCreateTableSessionMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: createTableSessionApi,
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: "Table session started successfully",
      });

      // Invalidate all related queries to ensure consistency across views
      queryClient.invalidateQueries({
        queryKey: ["tableSessions"],
      });

      queryClient.invalidateQueries({
        queryKey: ["tables"],
      });

      queryClient.invalidateQueries({
        queryKey: ["table", variables.tableId],
      });

      // Navigate to the session details page
      router.push(`/tables/${variables.tableId}/sessions/${data.id}`);

      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start table session",
        variant: "destructive",
      });
    },
  });
}

export function useEndTableSessionMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      sessionId,
      endedAt,
    }: {
      sessionId: string;
      endedAt?: string;
    }) => {
      const response = await endTableSessionApi(sessionId, endedAt);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Table session ended successfully",
      });

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["tableSessions"],
      });

      queryClient.invalidateQueries({
        queryKey: ["tableSession", data.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["table", data.tableId],
      });

      // If the session has a total cost, redirect to POS to finalize payment
      if (data.totalCost) {
        // Redirect to POS with the session ID as a parameter
        router.push(`/pos?tab=new&sessionId=${data.id}`);
      } else {
        // Just go back to the table detail page if no cost
        router.push(`/tables/${data.tableId}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to end table session",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSessionStatusMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateSessionStatusApi,
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Session status updated successfully",
      });

      // Invalidate the session and sessions list
      queryClient.invalidateQueries({
        queryKey: ["tableSession", data.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["tableSessions"],
      });

      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update session status",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTableSessionMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: deleteTableSessionApi,
    onMutate: async (sessionId) => {
      // Get the session details before deleting it
      const previousSession = queryClient.getQueryData<TableSession>([
        "tableSession",
        sessionId,
      ]);
      return { previousSession };
    },
    onSuccess: (_, sessionId, context) => {
      toast({
        title: "Success",
        description: "Session deleted successfully",
      });

      // Invalidate all relevant queries
      queryClient.invalidateQueries({
        queryKey: ["tableSessions"],
      });

      // If we have the previous session data, we can navigate back to the table
      if (context?.previousSession?.tableId) {
        router.push(`/tables/${context.previousSession.tableId}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete session",
        variant: "destructive",
      });
    },
  });
}

export function useCancelTableSessionMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/table-sessions/${sessionId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel session");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Session cancelled successfully",
      });

      // Invalidate all related queries to ensure consistency across views
      queryClient.invalidateQueries({ queryKey: ["tableSessions"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });

      if (data.id) {
        queryClient.invalidateQueries({ queryKey: ["tableSession", data.id] });
      }

      if (data.tableId) {
        queryClient.invalidateQueries({ queryKey: ["table", data.tableId] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel session",
        variant: "destructive",
      });
    },
  });
}

export function useMoveTableSessionMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: moveTableSessionApi,
    onSuccess: (data, variables) => {
      toast({
        title: "Éxito",
        description: "Sesión movida exitosamente",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["tableSessions"] });
      queryClient.invalidateQueries({ queryKey: ["tableSession"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });

      // Navigate to the new table's page
      router.push(`/tables/${variables.targetTableId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al mover la sesión",
        variant: "destructive",
      });
    },
  });
}
