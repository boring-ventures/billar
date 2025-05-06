"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { SessionStatus } from "@prisma/client";

export type SessionFormValues = {
  tableId: string;
};

export type TableSession = {
  id: string;
  tableId: string;
  staffId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  totalCost: number | null;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
  table: {
    id: string;
    name: string;
    hourlyRate: number | null;
  };
  staff?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

export function useSessions() {
  const { toast } = useToast();
  const router = useRouter();
  const [sessions, setSessions] = useState<TableSession[]>([]);
  const [activeSession, setActiveSession] = useState<TableSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<TableSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  const fetchSessions = useCallback(
    async (tableId?: string, status?: SessionStatus) => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();

        if (tableId) {
          queryParams.append("tableId", tableId);
        }

        if (status) {
          queryParams.append("status", status);
        }

        const response = await fetch(`/api/sessions?${queryParams.toString()}`);

        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch sessions",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
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
        const response = await fetch(`/api/sessions/${sessionId}`);

        if (response.ok) {
          const data = await response.json();
          setActiveSession(data);
          return data;
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch session details",
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

  const fetchTableSessions = useCallback(
    async (tableId: string) => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tables/${tableId}/sessions`);

        if (response.ok) {
          const data = await response.json();
          setSessionHistory(data);
          return data;
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch table sessions",
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

  const createSession = useCallback(
    async (tableId: string) => {
      try {
        setIsSubmitting(true);
        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tableId }),
        });

        if (response.ok) {
          const data = await response.json();
          toast({
            title: "Success",
            description: "Session started successfully",
          });
          await fetchSessions();
          router.push(`/tables/${tableId}/session/${data.id}`);
          return data;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to start session",
            variant: "destructive",
          });
          return null;
        }
      } catch (error) {
        console.error("Error creating session:", error);
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
    [fetchSessions, toast, router]
  );

  const endSession = useCallback(
    async (sessionId: string) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/sessions/${sessionId}/end`, {
          method: "POST",
        });

        if (response.ok) {
          const data = await response.json();
          toast({
            title: "Success",
            description: "Session ended successfully",
          });
          await fetchSessions();
          if (activeSession) {
            router.push(`/tables/${activeSession.tableId}`);
          }
          return data;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to end session",
            variant: "destructive",
          });
          return null;
        }
      } catch (error) {
        console.error("Error ending session:", error);
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
    [fetchSessions, toast, activeSession, router]
  );

  const cancelSession = useCallback(
    async (sessionId: string) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/sessions/${sessionId}/cancel`, {
          method: "POST",
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Session cancelled successfully",
          });
          await fetchSessions();
          if (activeSession) {
            router.push(`/tables/${activeSession.tableId}`);
          }
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to cancel session",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error cancelling session:", error);
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
    [fetchSessions, toast, activeSession, router]
  );

  const calculateCurrentCost = useCallback(
    (hourlyRate: number | null, durationInSeconds: number) => {
      if (!hourlyRate) return 0;

      const durationInHours = durationInSeconds / 3600;
      return hourlyRate * durationInHours;
    },
    []
  );

  return {
    sessions,
    activeSession,
    sessionHistory,
    isLoading,
    isSubmitting,
    sessionTime,
    setSessionTime,
    fetchSessions,
    fetchSessionById,
    fetchTableSessions,
    createSession,
    endSession,
    cancelSession,
    calculateCurrentCost,
  };
}
