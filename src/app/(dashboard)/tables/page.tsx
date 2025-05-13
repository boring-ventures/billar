"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TablesTable } from "@/components/tables/tables-table";
import { TableSessionsTable } from "@/components/tables/table-sessions-table";
import { TablesGridView } from "@/components/tables/tables-grid-view";
import {
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableDialog } from "@/components/tables/table-dialog";
import { SessionDialog } from "@/components/tables/session-dialog";

export default function TablesPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const viewParam = searchParams.get("view");
  const [activeTab, setActiveTab] = useState(
    tabParam === "sessions"
      ? "sessions"
      : tabParam === "all-sessions"
        ? "all-sessions"
        : "tables"
  );
  const [tableView, setTableView] = useState(
    viewParam === "grid" ? "grid" : "list"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  // Update the tab when URL changes
  useEffect(() => {
    setActiveTab(
      tabParam === "sessions"
        ? "sessions"
        : tabParam === "all-sessions"
          ? "all-sessions"
          : "tables"
    );
    setTableView(viewParam === "grid" ? "grid" : "list");
  }, [tabParam, viewParam]);

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Table Management</h2>
        <p className="text-muted-foreground">
          Manage tables and active sessions in the system.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="all-sessions">All Sessions</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "tables" && (
          <div className="flex items-center space-x-2">
            <Button
              variant={tableView === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setTableView("list")}
            >
              <TableIcon className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant={tableView === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setTableView("grid")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Grid
            </Button>
          </div>
        )}
      </div>

      {activeTab === "tables" && tableView === "list" && <TablesTable />}

      {activeTab === "tables" && tableView === "grid" && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-[300px]"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setTableDialogOpen(true)}>
                Add New Table
              </Button>
              <Button
                variant="outline"
                onClick={() => setSessionDialogOpen(true)}
              >
                Start Session
              </Button>
            </div>
          </div>
          <TablesGridView query={searchQuery} />
        </div>
      )}

      {activeTab === "sessions" && (
        <div className="mt-6">
          <TableSessionsTable activeOnly={true} />
        </div>
      )}

      {activeTab === "all-sessions" && (
        <div className="mt-6">
          <TableSessionsTable activeOnly={false} />
        </div>
      )}

      <TableDialog
        open={tableDialogOpen}
        onOpenChange={setTableDialogOpen}
        table={null}
        onSuccess={() => {
          // Refresh data
        }}
      />

      <SessionDialog
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
        onSuccess={() => {
          // Refresh data
        }}
      />
    </div>
  );
}
