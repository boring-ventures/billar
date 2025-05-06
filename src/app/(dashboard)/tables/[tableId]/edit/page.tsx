"use client";

import { useEffect, useState } from "react";
import { useParams, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TableForm } from "@/components/tables/table-form";
import { useTables } from "@/hooks/use-tables";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Table } from "@/types/table";
import { Loader2 } from "lucide-react";

export default function EditTablePage() {
  const params = useParams();
  const tableId = params.tableId as string;
  const { profile, isLoading: isLoadingUser } = useCurrentUser();
  const { fetchTableDetails, isDetailLoading } = useTables();
  const [table, setTable] = useState<Table | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has permission to edit tables (ADMIN or SUPERADMIN)
  if (
    !isLoadingUser &&
    profile?.role !== "ADMIN" &&
    profile?.role !== "SUPERADMIN"
  ) {
    redirect("/tables");
  }

  useEffect(() => {
    const loadTableData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tables/${tableId}`);

        if (response.ok) {
          const data = await response.json();
          setTable(data);
        } else {
          // If table not found or access denied, redirect back to tables list
          redirect("/tables");
        }
      } catch (error) {
        console.error("Error loading table:", error);
        redirect("/tables");
      } finally {
        setIsLoading(false);
      }
    };

    if (tableId) {
      loadTableData();
    }
  }, [tableId]);

  if (isLoading || isLoadingUser) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading table data...</p>
        </div>
      </div>
    );
  }

  if (!table) {
    redirect("/tables");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title={`Edit Table: ${table.name}`}
        description="Update table information"
      />

      <div className="max-w-2xl mx-auto border rounded-lg p-6 bg-card">
        <TableForm initialData={table} isEditMode />
      </div>
    </div>
  );
}
