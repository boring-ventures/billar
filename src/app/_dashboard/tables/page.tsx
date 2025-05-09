"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid } from "lucide-react";
import { TableStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/use-current-user";
import { TablesList } from "@/components/tables/tables-list";
import { TableStatusFilter } from "@/components/tables/table-status-filter";
import { CompanySelector } from "@/components/users/company-selector";
import { Separator } from "@/components/ui/separator";

export default function TablesPage() {
  const router = useRouter();
  const { currentUser, profile } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TableStatus | null>(null);

  // Use both currentUser and profile for compatibility
  const role = currentUser?.role || profile?.role;
  const isSuperAdmin = role === "SUPERADMIN";
  const canAddTable = role === "ADMIN" || role === "SUPERADMIN";

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddTable = () => {
    router.push("/tables/new");
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
        {/* Always show the Add Table button */}
        <Button 
          onClick={handleAddTable}
          size="lg"
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
            Add Table
          </Button>
      </div>

      {isSuperAdmin && (
        <>
          <div className="p-4 border-2 border-primary rounded-md bg-primary/5">
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Superadmin: Select a Company</h3>
                <p className="text-sm text-muted-foreground max-w-lg">
                  As a superadmin, you need to select a company to manage its tables. 
                  Select a company below or create a new one.
                </p>
              </div>
              <CompanySelector />
            </div>
          </div>
          
          {/* Direct action button for superadmins */}
          <div className="bg-muted p-6 rounded-lg border flex flex-col items-center justify-center text-center">
            <LayoutGrid className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-medium mb-2">Create Your First Table</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Start managing your billiard tables by creating your first table. This will allow you to track sessions, maintenance, and revenue.
            </p>
            <Button 
              onClick={handleAddTable}
              size="lg" 
              className="px-8"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Table Now
            </Button>
          </div>
          
          <Separator />
        </>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 w-full sm:max-w-md">
          <Input
            placeholder="Search tables..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        <TableStatusFilter value={statusFilter} onChange={setStatusFilter} />
      </div>

      <TablesList 
        searchQuery={searchQuery} 
        statusFilter={statusFilter} 
        canAddTable={true}
      />

      {/* Floating action button for quick access */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={handleAddTable}
          size="lg"
          className="shadow-lg rounded-full h-14 w-14 p-0"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
