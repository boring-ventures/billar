"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { TableForm } from "@/components/tables/table-form";
import { useCurrentUser } from "@/hooks/use-current-user";
import { redirect } from "next/navigation";
import { CompanySelector } from "@/components/users/company-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function NewTablePage() {
  const { currentUser, profile, isLoading } = useCurrentUser();

  // Use both currentUser and profile for compatibility
  const role = currentUser?.role || profile?.role;
  const companyId = currentUser?.companyId || profile?.companyId;
  const isSuperAdmin = role === "SUPERADMIN";
  const hasCompany = !!companyId;

  // Check if user has permission to create tables (ADMIN or SUPERADMIN)
  if (
    !isLoading &&
    role !== "ADMIN" &&
    role !== "SUPERADMIN"
  ) {
    redirect("/tables");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Add New Table"
        description="Create a new billiard table"
      />

      {isSuperAdmin && !hasCompany && (
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              As a superadmin, you need to select a company before creating a table.
            </AlertDescription>
          </Alert>
          
          <div className="p-6 border rounded-lg bg-card mb-6">
            <h3 className="text-lg font-medium mb-2">Select a Company</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please select a company to create a table for:
            </p>
            <CompanySelector />
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto border rounded-lg p-6 bg-card">
        <TableForm />
      </div>
    </div>
  );
}
