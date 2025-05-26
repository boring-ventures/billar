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
import { useAuth } from "@/providers/auth-provider";

export default function TableDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const tableId = params?.id as string;
  const [activeTab, setActiveTab] = useState("sessions");
  const [activeDuration, setActiveDuration] = useState("");
  const [quickStartDialogOpen, setQuickStartDialogOpen] = useState(false);

  // Check if user has admin privileges (ADMIN or SUPERADMIN)
  const isAdmin = profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";

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
      endSessionMutation.mutate({ sessionId: activeSession.id });
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
          <h2 className="text-3xl font-bold tracking-tight">
            Mesa no encontrada
          </h2>
        </div>
        <Button onClick={handleBack} className="mt-4" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
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
            Volver
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
              Iniciar Sesión
            </Button>
          )}
          {isAdmin && (
            <Button onClick={handleEditTable} size="sm" variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Display active session prominently if exists */}
      {activeSession && (
        <Card className="overflow-hidden border-2 border-red-500 bg-red-50 mb-6">
          <CardHeader className="pb-3 bg-red-100 border-b border-red-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-600 text-white">SESIÓN ACTIVA</Badge>
                  <CardTitle>
                    {new Date(activeSession.startedAt).toLocaleString()}
                  </CardTitle>
                </div>
                <CardDescription>
                  Sesión iniciada a las{" "}
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
                  {endSessionMutation.isPending
                    ? "Finalizando..."
                    : "Finalizar Sesión"}
                </Button>
                <SessionCancelDialog sessionId={activeSession.id} size="sm" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewSessionDetails}
                >
                  Ver Detalles
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-4">
            <Alert className="mb-4 bg-red-100 border-red-200 text-red-800">
              <Timer className="h-4 w-4" />
              <AlertTitle>Sesión en Curso</AlertTitle>
              <AlertDescription>
                Esta mesa está actualmente en uso. El tiempo está corriendo y
                los cargos se están acumulando.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Duración Actual
                </p>
                <p className="flex items-center gap-1 text-xl font-bold text-red-700">
                  <Timer className="h-5 w-5" />
                  {activeDuration || "Calculando..."}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Costo Aproximado
                </p>
                <p className="text-xl font-bold text-red-700">
                  {calculateApproxCost()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Personal
                </p>
                <p>
                  {activeSession.staff
                    ? `${activeSession.staff.firstName || ""} ${activeSession.staff.lastName || ""}`.trim()
                    : "No asignado"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Detalles de la Mesa</CardTitle>
          <CardDescription>Información básica sobre esta mesa</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Empresa</p>
            <p>{table.company?.name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Tarifa por Hora
            </p>
            <p>{table.hourlyRate ? formatCurrency(table.hourlyRate) : "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Estado</p>
            <p>{table.status}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Creada</p>
            <p>{new Date(table.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Última Actualización
            </p>
            <p>{new Date(table.updatedAt).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="sessions">Sesiones</TabsTrigger>
          <TabsTrigger value="activity">Registro de Actividad</TabsTrigger>
          <TabsTrigger value="reservations">Reservas</TabsTrigger>
          <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
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
