"use client";

import { PageHeader } from "@/components/page-header";
import { TableForm } from "@/components/tables/table-form";
import { useCurrentUser } from "@/hooks/use-current-user";
import { redirect } from "next/navigation";

export default function NewTablePage() {
  const { profile, isLoading } = useCurrentUser();

  // Check if user has permission to create tables (ADMIN or SUPERADMIN)
  if (
    !isLoading &&
    profile?.role !== "ADMIN" &&
    profile?.role !== "SUPERADMIN"
  ) {
    redirect("/tables");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Add New Table"
        description="Create a new billiard table"
      />

      <div className="max-w-2xl mx-auto border rounded-lg p-6 bg-card">
        <TableForm />
      </div>
    </div>
  );
}
