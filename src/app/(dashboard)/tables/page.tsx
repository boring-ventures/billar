"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { TableStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/use-current-user";
import { TablesList } from "@/components/tables/tables-list";
import { TableStatusFilter } from "@/components/tables/table-status-filter";

export default function TablesPage() {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TableStatus | null>(null);

  const canAddTable =
    profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Trigger search
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Table Management
          </h2>
          <p className="text-muted-foreground">
            Manage your billiard tables and their status
          </p>
        </div>
        {canAddTable && (
          <Button onClick={() => router.push("/tables/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Table
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 w-full sm:max-w-md">
          <Input
            placeholder="Search tables..."
            value={searchQuery}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            className="w-full"
          />
        </div>
        <TableStatusFilter value={statusFilter} onChange={setStatusFilter} />
      </div>

      <TablesList searchQuery={searchQuery} statusFilter={statusFilter} />
    </div>
  );
}
