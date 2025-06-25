"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { SessionStatus, TableSession } from "@prisma/client";
import {
  useTableSessionsQuery,
  useEndTableSessionMutation,
  useCancelTableSessionMutation,
} from "@/hooks/use-table-sessions-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { DataTable } from "./data-table";
import { MoreHorizontal, StopCircle, Eye, ArrowRight, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SessionDialog } from "./session-dialog";
import { TableSessionsTableSkeleton } from "./table-sessions-table-skeleton";
import { MoveSessionDialog } from "./move-session-dialog";
import { useAuth } from "@/providers/auth-provider";

interface TableSessionsTableProps {
  activeOnly?: boolean;
}

// Define the extended session type
interface ExtendedTableSession extends TableSession {
  table?: {
    name: string;
  } | null;
  staff?: {
    firstName?: string;
    lastName?: string;
  } | null;
}

// Define the session with duration
interface SessionWithDuration extends ExtendedTableSession {
  duration: number;
  durationFormatted: string;
}

export function TableSessionsTable({
  activeOnly = false,
}: TableSessionsTableProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>(
    activeOnly ? "ACTIVE" : "all"
  );
  const [isEndSessionAlertOpen, setIsEndSessionAlertOpen] = useState(false);
  const [isCancelSessionAlertOpen, setIsCancelSessionAlertOpen] =
    useState(false);
  const [selectedSession, setSelectedSession] =
    useState<SessionWithDuration | null>(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  // Update statusFilter when activeOnly prop changes
  useEffect(() => {
    setStatusFilter(activeOnly ? "ACTIVE" : "all");
  }, [activeOnly]);

  // Determine if user should see all company sessions or just their company's
  const isSuperAdmin = profile?.role === "SUPERADMIN";
  const companyId = isSuperAdmin ? undefined : profile?.companyId || undefined;

  const { data: sessions = [], isLoading } = useTableSessionsQuery({
    status:
      statusFilter === "all"
        ? undefined
        : (statusFilter as SessionStatus | undefined),
    companyId,
  });

  const endSessionMutation = useEndTableSessionMutation();
  const cancelSessionMutation = useCancelTableSessionMutation();

  // Calculate durations for each session
  const sessionsWithDuration = useMemo(() => {
    return sessions.map((session: ExtendedTableSession) => {
      const start = new Date(session.startedAt);
      const end = session.endedAt ? new Date(session.endedAt) : new Date();
      const durationMs = end.getTime() - start.getTime();
      return {
        ...session,
        duration: durationMs,
        durationFormatted: formatDuration(durationMs),
      };
    });
  }, [sessions]);

  const handleEndSession = async () => {
    if (selectedSession) {
      await endSessionMutation.mutateAsync({ sessionId: selectedSession.id });
      setIsEndSessionAlertOpen(false);
    }
  };

  const handleCancelSession = async () => {
    if (selectedSession) {
      await cancelSessionMutation.mutateAsync(selectedSession.id);
      setIsCancelSessionAlertOpen(false);
    }
  };

  const handleStartNewSession = () => {
    setSessionDialogOpen(true);
  };

  const handleMoveSession = (session: SessionWithDuration) => {
    setSelectedSession(session);
    setMoveDialogOpen(true);
  };

  const columns: ColumnDef<SessionWithDuration>[] = [
    {
      accessorKey: "table.name",
      header: "Mesa",
      cell: ({ row }) => {
        const original = row.original;
        return (
          <div className="font-medium">{original.table?.name || "N/A"}</div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("status") as SessionStatus;
        let badgeClass = "";

        switch (status) {
          case "ACTIVE":
            badgeClass = "bg-green-500/15 text-green-600";
            break;
          case "COMPLETED":
            badgeClass = "bg-blue-500/15 text-blue-600";
            break;
          case "CANCELLED":
            badgeClass = "bg-red-500/15 text-red-600";
            break;
        }

        return <Badge className={badgeClass}>{status}</Badge>;
      },
    },
    {
      accessorKey: "startedAt",
      header: "Iniciada",
      cell: ({ row }) => {
        const date = new Date(row.getValue("startedAt"));
        return <div>{date.toLocaleString()}</div>;
      },
    },
    {
      accessorKey: "endedAt",
      header: "Finalizada",
      cell: ({ row }) => {
        const endDate = row.getValue("endedAt");
        return (
          <div>
            {endDate ? new Date(endDate as string).toLocaleString() : "--"}
          </div>
        );
      },
    },
    {
      accessorKey: "durationFormatted",
      header: "Duración",
      cell: ({ row }) => {
        return <div>{row.getValue("durationFormatted")}</div>;
      },
    },
    {
      accessorKey: "totalCost",
      header: "Costo",
      cell: ({ row }) => {
        const cost = row.getValue("totalCost") as number | null;
        return <div>{cost ? formatCurrency(cost) : "--"}</div>;
      },
    },
    {
      accessorKey: "staff",
      header: "Personal",
      cell: ({ row }) => {
        const original = row.original;
        const staff = original.staff;
        return (
          <div>
            {staff
              ? `${staff.firstName || ""} ${staff.lastName || ""}`.trim()
              : "N/A"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const session = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/tables/${session.tableId}/sessions/${session.id}`
                  )
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalles
              </DropdownMenuItem>

              {session.status === "ACTIVE" && (
                <>
                  <DropdownMenuItem onClick={() => handleMoveSession(session)}>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Mover Mesa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedSession(session);
                      setIsEndSessionAlertOpen(true);
                    }}
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Finalizar Sesión
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedSession(session);
                      setIsCancelSessionAlertOpen(true);
                    }}
                    className="text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar Sesión
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return <TableSessionsTableSkeleton />;
  }

  const statusOptions = activeOnly ? (
    <>
      <SelectItem value="ACTIVE">Activa</SelectItem>
    </>
  ) : (
    <>
      <SelectItem value="all">Todas las Sesiones</SelectItem>
      <SelectItem value="ACTIVE">Activa</SelectItem>
      <SelectItem value="COMPLETED">Completada</SelectItem>
      <SelectItem value="CANCELLED">Cancelada</SelectItem>
    </>
  );

  const statusFilterElement = (
    <Select
      value={statusFilter}
      onValueChange={setStatusFilter}
      disabled={activeOnly}
    >
      <SelectTrigger className="w-full md:w-[180px]">
        <SelectValue placeholder="Filtrar por estado" />
      </SelectTrigger>
      <SelectContent>{statusOptions}</SelectContent>
    </Select>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={sessionsWithDuration}
        statusFilter={statusFilterElement}
        onAddNew={handleStartNewSession}
        addNewLabel="Iniciar Nueva Sesión"
      />

      <SessionDialog
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
        onSuccess={() => {
          // Refresh data
        }}
      />

      <AlertDialog
        open={isEndSessionAlertOpen}
        onOpenChange={setIsEndSessionAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Finalizar esta sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto finalizará la sesión activa y calculará el costo final. La
              mesa quedará disponible nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndSession}
              disabled={endSessionMutation.isPending}
            >
              {endSessionMutation.isPending
                ? "Procesando..."
                : "Finalizar Sesión"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isCancelSessionAlertOpen}
        onOpenChange={setIsCancelSessionAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto cancelará la sesión activa. No se aplicarán cargos. La mesa
              quedará disponible nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSession}
              className="bg-destructive text-destructive-foreground"
              disabled={cancelSessionMutation.isPending}
            >
              {cancelSessionMutation.isPending
                ? "Procesando..."
                : "Cancelar Sesión"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MoveSessionDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        sessionId={selectedSession?.id}
        currentTableName={selectedSession?.table?.name}
        currentTableId={selectedSession?.tableId}
        onSuccess={() => {
          setMoveDialogOpen(false);
          setSelectedSession(null);
        }}
      />
    </>
  );
}
