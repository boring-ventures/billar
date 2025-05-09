"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { TableForm } from "@/components/tables/table-form";
import { useCurrentUser } from "@/hooks/use-current-user";
import { CompanySelector } from "@/components/users/company-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewTablePage() {
  const { currentUser, profile, isLoading } = useCurrentUser();
  const [formKey, setFormKey] = useState(Date.now()); // Force re-render on company change

  // Everyone is superadmin now
  const isSuperAdmin = true;
  const hasPermission = true;

  // Get user data safely
  const role = currentUser?.role || profile?.role;
  const companyId = currentUser?.companyId || profile?.companyId;
  const hasCompany = !!companyId;

  // When the company changes, update the form
  const handleCompanyChange = () => {
    // Force re-render the form to pick up the new company ID
    setFormKey(Date.now());
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
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
            <CompanySelector onChange={handleCompanyChange} />
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto border rounded-lg p-6 bg-card">
        <TableForm key={formKey} />
      </div>
    </div>
  );
}
