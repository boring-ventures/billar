"use client";

import { useState, useEffect } from "react";
import { useParams, redirect } from "next/navigation";
import { useTable, useTableDetails } from "@/hooks/use-tables";
import { TableForm } from "@/components/tables/table-form";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";

export default function EditTablePage() {
  const params = useParams();
  const tableId = params?.tableId as string;
  const { currentUser, profile, isLoading: isLoadingUser } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(true);

  // Everyone is superadmin now
  const hasPermission = true;

  // Use the tableDetails hook for backward compatibility
  const { tableDetails, isDetailLoading, fetchTableDetails } = useTableDetails(tableId);

  useEffect(() => {
    if (tableId) {
      fetchTableDetails(tableId).then(() => {
        setIsLoading(false);
      });
    }
  }, [tableId, fetchTableDetails]);

  // If table not found or access denied, redirect back to tables list
  if (!isDetailLoading && !tableDetails) {
    redirect("/tables");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
        title="Edit Table" 
        description="Update details for this billiard table"
      />

      {isLoading || isDetailLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
      ) : (
        <TableForm initialData={tableDetails} isEditMode={true} />
      )}
    </div>
  );
}
