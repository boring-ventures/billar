"use client";

import { useState, useCallback } from "react";
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

export function useTableSessions() {
  const { toast } = useToast();
  const router = useRouter();
  const [sessions, setSessions] = useState<TableSession[]>([]);
  const [activeSession, setActiveSession] = useState<TableSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTableSessions = useCallback(
    async (params?: {
      tableId?: string;
      companyId?: string;
      status?: SessionStatus;
    }) => {
      try {
        setIsLoading(true);
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

        const response = await fetch(
          `/api/table-sessions?${queryParams.toString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setSessions(data);
          return data;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to fetch table sessions",
            variant: "destructive",
          });
          return [];
        }
      } catch (error) {
        console.error("Error fetching table sessions:", error);
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

  const fetchSessionById = useCallback(
    async (sessionId: string) => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/table-sessions/${sessionId}`);

        if (response.ok) {
          const data = await response.json();
          setActiveSession(data);
          return data;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to fetch session details",
            variant: "destructive",
          });
          return null;
        }
      } catch (error) {
        console.error("Error fetching session:", error);
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

  const createTableSession = useCallback(
    async (tableId: string, staffId?: string) => {
      try {
        setIsSubmitting(true);
        const response = await fetch("/api/table-sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tableId, staffId }),
        });

        if (response.ok) {
          const data = await response.json();
          toast({
            title: "Success",
            description: "Table session started successfully",
          });
          // Navigate to the session details page
          router.push(`/tables/${tableId}/sessions/${data.id}`);
          return data;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to start table session",
            variant: "destructive",
          });
          return null;
        }
      } catch (error) {
        console.error("Error creating table session:", error);
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
    [toast, router]
  );

  const endTableSession = useCallback(
    async (sessionId: string) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/table-sessions/${sessionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ endSession: true }),
        });

        if (response.ok) {
          const data = await response.json();
          toast({
            title: "Success",
            description: "Table session ended successfully",
          });
          // Navigate back to the table details page
          if (activeSession?.tableId) {
            router.push(`/tables/${activeSession.tableId}`);
          }
          return data;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to end table session",
            variant: "destructive",
          });
          return null;
        }
      } catch (error) {
        console.error("Error ending table session:", error);
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
    [toast, router, activeSession]
  );

  const deleteTableSession = useCallback(
    async (sessionId: string) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/table-sessions/${sessionId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Session deleted successfully",
          });
          // Navigate back to the table details page
          if (activeSession?.tableId) {
            router.push(`/tables/${activeSession.tableId}`);
          }
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to delete session",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error deleting session:", error);
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
    [toast, router, activeSession]
  );

  const updateSessionStatus = useCallback(
    async (sessionId: string, status: SessionStatus) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/table-sessions/${sessionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });

        if (response.ok) {
          const data = await response.json();
          toast({
            title: "Success",
            description: "Session status updated successfully",
          });
          // Refresh the active session if we're viewing it
          if (activeSession?.id === sessionId) {
            await fetchSessionById(sessionId);
          }
          return data;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to update session status",
            variant: "destructive",
          });
          return null;
        }
      } catch (error) {
        console.error("Error updating session status:", error);
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
    [toast, fetchSessionById, activeSession]
  );

  return {
    sessions,
    activeSession,
    isLoading,
    isSubmitting,
    fetchTableSessions,
    fetchSessionById,
    createTableSession,
    endTableSession,
    deleteTableSession,
    updateSessionStatus,
  };
}
