"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { type Table, type TableStatus } from "@prisma/client";

export type TableFormValues = {
  name: string;
  status: TableStatus;
  hourlyRate?: number;
  companyId?: string;
};

export type TableWithDetails = Table & {
  activityLogs: Array<{
    id: string;
    previousStatus: TableStatus;
    newStatus: TableStatus;
    changedAt: Date;
    notes?: string | null;
  }>;
  maintenances: Array<{
    id: string;
    description: string | null;
    maintenanceAt: Date;
    cost: number | null;
  }>;
};

export function useTables() {
  const { toast } = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [tableDetails, setTableDetails] = useState<TableWithDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTables = useCallback(
    async (searchQuery?: string) => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();
        if (searchQuery) {
          queryParams.append("query", searchQuery);
        }

        const response = await fetch(`/api/tables?${queryParams.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setTables(data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch tables",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching tables:", error);
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

  const fetchTableDetails = useCallback(
    async (tableId: string) => {
      try {
        setIsDetailLoading(true);
        const response = await fetch(`/api/tables/${tableId}`);

        if (response.ok) {
          const data = await response.json();
          setTableDetails(data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch table details",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching table details:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsDetailLoading(false);
      }
    },
    [toast]
  );

  const createTable = useCallback(
    async (tableData: TableFormValues) => {
      try {
        setIsSubmitting(true);
        
        // Deep clone the data to avoid modifying the original
        const dataToSend = { ...tableData };
        
        // Validation checks
        if (!dataToSend.companyId) {
          console.error("Company ID is required but missing");
          toast({
            title: "Error",
            description: "Company ID is required to create a table",
            variant: "destructive",
          });
          return false;
        }
        
        // Format the hourly rate as a number if present
        if (dataToSend.hourlyRate !== undefined) {
          dataToSend.hourlyRate = Number(dataToSend.hourlyRate);
        }
        
        // Log the data being sent to help with debugging
        console.log("API call - Creating table with data:", dataToSend);
        
        const response = await fetch("/api/tables", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        });

        // Always parse response data
        let responseData;
        try {
          responseData = await response.json();
          console.log("API response data:", responseData);
        } catch (err) {
          console.error("Failed to parse response:", err);
          responseData = { error: "Failed to parse server response" };
        }

        if (response.ok) {
          toast({
            title: "Success",
            description: "Table created successfully",
          });
          
          // Only update state after confirming success
          await fetchTables();
          return true;
        } else {
          // Detailed error logging
          console.error("Error creating table:", { 
            status: response.status,
            data: responseData
          });
          
          toast({
            title: "Error",
            description: responseData.error || "Failed to create table",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error creating table:", error);
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
          toast({
            title: "Success",
            description: "Table updated successfully",
          });
          await fetchTables();
          if (tableDetails) {
            await fetchTableDetails(tableId);
          }
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to update table",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error updating table:", error);
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
    [fetchTables, fetchTableDetails, tableDetails, toast]
  );

  const deleteTable = useCallback(
    async (tableId: string) => {
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
          await fetchTables();
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

  const updateTableStatus = useCallback(
    async (tableId: string, newStatus: TableStatus, notes?: string) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/tables/${tableId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus, notes }),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: `Table status updated to ${newStatus}`,
          });
          await fetchTables();
          if (tableDetails) {
            await fetchTableDetails(tableId);
          }
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to update table status",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error updating table status:", error);
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
    [fetchTables, fetchTableDetails, tableDetails, toast]
  );

  return {
    tables,
    tableDetails,
    isLoading,
    isDetailLoading,
    isSubmitting,
    fetchTables,
    fetchTableDetails,
    createTable,
    updateTable,
    deleteTable,
    updateTableStatus,
  };
}
