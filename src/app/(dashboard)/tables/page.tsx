"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablesList } from "@/components/tables/tables-list";
import { PageHeader } from "@/components/page-header";
import { useCurrentUser } from "@/hooks/use-current-user";
import { TableStatusFilter } from "@/components/tables/table-status-filter";
import { TableStatus } from "@prisma/client";

export default function TablesPage() {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TableStatus | null>(null);

  const canAddTable =
    profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Table Management"
        description="View and manage all billiard tables"
      />

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="w-full max-w-md">
            <Input
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <TableStatusFilter value={statusFilter} onChange={setStatusFilter} />
        </div>
        {canAddTable && (
          <Button onClick={() => router.push("/tables/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Table
          </Button>
        )}
      </div>

      <TablesList searchQuery={searchQuery} statusFilter={statusFilter} />
    </div>
  );
}
