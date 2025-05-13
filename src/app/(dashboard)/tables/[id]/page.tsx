"use client";

import { useParams, useRouter } from "next/navigation";
import { useTableByIdQuery } from "@/hooks/use-tables-query";
import {
  useTableSessionsQuery,
  useEndTableSessionMutation,
} from "@/hooks/use-table-sessions-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Play, StopCircle, Timer } from "lucide-react";
import { TableStatus, SessionStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { TableSessionsHistory } from "@/components/tables/table-sessions-history";
import { TableActivityHistory } from "@/components/tables/table-activity-history";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TableReservations } from "@/components/tables/table-reservations";
import { TableMaintenanceHistory } from "@/components/tables/table-maintenance-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { SessionCancelDialog } from "@/components/tables/session-cancel-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDuration, formatCurrency } from "@/lib/utils";
import { QuickStartSessionDialog } from "@/components/tables/quick-start-session-dialog";
import { TableDetailsSkeleton } from "@/components/tables/table-details-skeleton";
import { ActiveSessionSkeleton } from "@/components/tables/active-session-skeleton";

export default function TableDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params?.id as string;
  const [activeTab, setActiveTab] = useState("sessions");
  const [activeDuration, setActiveDuration] = useState("");
  const [quickStartDialogOpen, setQuickStartDialogOpen] = useState(false);

  const { data: table, isLoading: tableLoading } = useTableByIdQuery(tableId);
  const endSessionMutation = useEndTableSessionMutation();

  // Fetch active sessions for this table
  const { data: activeSessions = [], isLoading: sessionsLoading } =
    useTableSessionsQuery({
      tableId,
      status: "ACTIVE",
    });

  const isLoading = tableLoading || sessionsLoading;

  // Only set activeSession when not in loading state
  const activeSession =
    !isLoading && activeSessions.length > 0 ? activeSessions[0] : null;

  // Update active session duration every second
  useEffect(() => {
    if (activeSession) {
      const updateDuration = () => {
        const startDate = new Date(activeSession.startedAt);
        const now = new Date();
        const durationMs = now.getTime() - startDate.getTime();
        setActiveDuration(formatDuration(durationMs));
      };

      // Initial calculation
      updateDuration();

      // Set interval for updates
      const interval = setInterval(updateDuration, 1000);

      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const handleBack = () => {
    router.back();
  };

  const handleEditTable = () => {
    router.push(`/tables/${tableId}/edit`);
  };

  const handleStartSession = () => {
    if (table?.status !== "AVAILABLE") {
      return;
    }

    setQuickStartDialogOpen(true);
  };

  const handleEndSession = () => {
    if (activeSession) {
      endSessionMutation.mutate(activeSession.id);
    }
  };

  const handleViewSessionDetails = () => {
    if (activeSession) {
      router.push(`/tables/${tableId}/sessions/${activeSession.id}`);
    }
  };

  const getStatusColor = (status: TableStatus | SessionStatus) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500/15 text-green-600";
      case "OCCUPIED":
      case "ACTIVE":
        return "bg-red-500/15 text-red-600";
      case "RESERVED":
        return "bg-blue-500/15 text-blue-600";
      case "MAINTENANCE":
        return "bg-amber-500/15 text-amber-600";
      case "COMPLETED":
        return "bg-blue-500/15 text-blue-600";
      case "CANCELLED":
        return "bg-gray-500/15 text-gray-600";
      default:
        return "bg-gray-500/15 text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <>
        <TableDetailsSkeleton />
        <ActiveSessionSkeleton />
      </>
    );
  }

  if (!table) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Table not found</h2>
        </div>
        <Button onClick={handleBack} className="mt-4" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  // Calculate approximate current cost if there's an active session
  const calculateApproxCost = () => {
    if (activeSession && table.hourlyRate) {
      const startDate = new Date(activeSession.startedAt);
      const now = new Date();
      const durationHours =
        (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      return formatCurrency(durationHours * Number(table.hourlyRate));
    }
    return "--";
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={handleBack} size="sm" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {table.name}
          </h2>
          <Badge className={getStatusColor(table.status)}>{table.status}</Badge>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {table.status === "AVAILABLE" && (
            <Button onClick={handleStartSession} size="sm">
              <Play className="mr-2 h-4 w-4" />
              Start Session
            </Button>
          )}
          <Button onClick={handleEditTable} size="sm" variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Display active session prominently if exists */}
      {activeSession && (
        <Card className="overflow-hidden border-2 border-red-500 bg-red-50 mb-6">
          <CardHeader className="pb-3 bg-red-100 border-b border-red-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-600 text-white">
                    ACTIVE SESSION
                  </Badge>
                  <CardTitle>
                    {new Date(activeSession.startedAt).toLocaleString()}
                  </CardTitle>
                </div>
                <CardDescription>
                  Session started at{" "}
                  {new Date(activeSession.startedAt).toLocaleTimeString()}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleEndSession}
                  disabled={endSessionMutation.isPending}
                  size="sm"
                >
                  <StopCircle className="mr-2 h-4 w-4" />
                  {endSessionMutation.isPending ? "Ending..." : "End Session"}
                </Button>
                <SessionCancelDialog sessionId={activeSession.id} size="sm" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewSessionDetails}
                >
                  View Details
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-4">
            <Alert className="mb-4 bg-red-100 border-red-200 text-red-800">
              <Timer className="h-4 w-4" />
              <AlertTitle>Ongoing Session</AlertTitle>
              <AlertDescription>
                This table is currently in use. The timer is running and charges
                are accruing.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current Duration
                </p>
                <p className="flex items-center gap-1 text-xl font-bold text-red-700">
                  <Timer className="h-5 w-5" />
                  {activeDuration || "Calculating..."}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Approx. Cost
                </p>
                <p className="text-xl font-bold text-red-700">
                  {calculateApproxCost()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Staff
                </p>
                <p>
                  {activeSession.staff
                    ? `${activeSession.staff.firstName || ""} ${activeSession.staff.lastName || ""}`.trim()
                    : "Not assigned"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Table Details</CardTitle>
          <CardDescription>Basic information about this table</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Company</p>
            <p>{table.company?.name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Hourly Rate
            </p>
            <p>{table.hourlyRate ? `$${table.hourlyRate}` : "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p>{table.status}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Created</p>
            <p>{new Date(table.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Last Updated
            </p>
            <p>{new Date(table.updatedAt).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        <TabsContent value="sessions" className="mt-6">
          <TableSessionsHistory tableId={tableId} />
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <TableActivityHistory tableId={tableId} />
        </TabsContent>
        <TabsContent value="reservations" className="mt-6">
          <TableReservations tableId={tableId} />
        </TabsContent>
        <TabsContent value="maintenance" className="mt-6">
          <TableMaintenanceHistory tableId={tableId} />
        </TabsContent>
      </Tabs>

      <QuickStartSessionDialog
        open={quickStartDialogOpen}
        onOpenChange={setQuickStartDialogOpen}
        table={table}
        onSuccess={() => {
          setQuickStartDialogOpen(false);
        }}
      />
    </div>
  );
}
