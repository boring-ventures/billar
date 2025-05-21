"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TablesTable } from "@/components/tables/tables-table";
import { TableSessionsTable } from "@/components/tables/table-sessions-table";
import { TablesGridView } from "@/components/tables/tables-grid-view";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableDialog } from "@/components/tables/table-dialog";
import { SessionDialog } from "@/components/tables/session-dialog";
import { useAuth } from "@/providers/auth-provider";

export default function TablesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
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
    viewParam === "list" ? "list" : "grid"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  // Check if user has admin privileges (ADMIN or SUPERADMIN)
  const isAdmin = profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";

  // Update the tab when URL changes
  useEffect(() => {
    setActiveTab(
      tabParam === "sessions"
        ? "sessions"
        : tabParam === "all-sessions"
          ? "all-sessions"
          : "tables"
    );
    setTableView(viewParam === "list" ? "list" : "grid");
  }, [tabParam, viewParam]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "tables") {
      router.push("/tables");
    } else if (value === "sessions") {
      router.push("/tables?tab=sessions");
    } else if (value === "all-sessions") {
      router.push("/tables?tab=all-sessions");
    }
  };

  // Update URL when view changes
  const handleViewChange = (view: string) => {
    setTableView(view);
    if (activeTab === "tables") {
      router.push(`/tables?view=${view}`);
    }
  };

  // Function to render the appropriate content based on active tab and loading state
  const renderTabContent = () => {
    if (activeTab === "tables") {
      if (tableView === "list") {
        return <TablesTable />;
      } else {
        return (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Buscar mesas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-[300px]"
                />
              </div>
              <div className="flex space-x-2">
                {isAdmin && (
                  <Button onClick={() => setTableDialogOpen(true)}>
                    Añadir Nueva Mesa
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSessionDialogOpen(true)}
                >
                  Iniciar Sesión
                </Button>
              </div>
            </div>
            <TablesGridView query={searchQuery} />
          </div>
        );
      }
    } else if (activeTab === "sessions") {
      return (
        <div className="mt-6">
          <TableSessionsTable activeOnly={true} />
        </div>
      );
    } else {
      return (
        <div className="mt-6">
          <TableSessionsTable activeOnly={false} />
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Mesas</h2>
        <p className="text-muted-foreground">
          Administra mesas y sesiones activas en el sistema.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tables">Mesas</TabsTrigger>
            <TabsTrigger value="sessions">Sesiones Activas</TabsTrigger>
            <TabsTrigger value="all-sessions">Todas las Sesiones</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "tables" && (
          <div className="flex items-center space-x-2">
            <Button
              variant={tableView === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("list")}
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Lista
            </Button>
            <Button
              variant={tableView === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("grid")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Cuadrícula
            </Button>
          </div>
        )}
      </div>

      {renderTabContent()}

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
