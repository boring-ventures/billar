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

  // Get user data safely
  const role = currentUser?.role || profile?.role;
  const companyId = currentUser?.companyId || profile?.companyId;
  const isSuperAdmin = role === "SUPERADMIN";
  const hasCompany = !!companyId;
  const hasPermission = role === "ADMIN" || role === "SUPERADMIN";

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

  // Permission check - No more redirects, just show a message
  if (!hasPermission) {
    return (
      <div className="container mx-auto py-12">
        <div className="max-w-2xl mx-auto border rounded-lg p-8 bg-card text-center">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="mb-6 text-muted-foreground">
            You don't have permission to create new tables. Please contact your administrator.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/tables"}
          >
            Return to Tables
          </Button>
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
