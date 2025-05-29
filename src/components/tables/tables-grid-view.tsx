"use client";

import { useState } from "react";
import { Table, useTablesQuery } from "@/hooks/use-tables-query";
import { TableStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  MoreHorizontal,
  Edit,
  PlayCircle,
  StopCircle,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SessionDialog } from "./session-dialog";
import { TableDialog } from "./table-dialog";
import { QuickStartSessionDialog } from "./quick-start-session-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCancelTableSessionMutation,
  useTableSessionsQuery,
  TableSession,
} from "@/hooks/use-table-sessions-query";
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
import { useAuth } from "@/providers/auth-provider";
import { MoveSessionDialog } from "./move-session-dialog";

interface TablesGridViewProps {
  companyId?: string;
  query?: string;
}

export function TablesGridView({ companyId, query }: TablesGridViewProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const { data: tables = [], isLoading } = useTablesQuery({
    companyId,
    query,
  });
  const { data: activeSessions = [] } = useTableSessionsQuery({
    status: "ACTIVE",
  });

  // Check if user has admin privileges (ADMIN or SUPERADMIN)
  const isAdmin = profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";

  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [quickStartDialogOpen, setQuickStartDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isCancelSessionAlertOpen, setIsCancelSessionAlertOpen] =
    useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [moveSessionDialogOpen, setMoveSessionDialogOpen] = useState(false);

  const cancelSessionMutation = useCancelTableSessionMutation();

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case "AVAILABLE":
        return {
          card: "bg-green-50 border-green-500",
          text: "text-green-700",
          table: "bg-green-100 border-green-600",
          cloth: "bg-green-200",
        };
      case "OCCUPIED":
        return {
          card: "bg-red-50 border-red-500",
          text: "text-red-700",
          table: "bg-red-100 border-red-600",
          cloth: "bg-red-200",
        };
      case "RESERVED":
        return {
          card: "bg-blue-50 border-blue-500",
          text: "text-blue-700",
          table: "bg-blue-100 border-blue-600",
          cloth: "bg-blue-200",
        };
      case "MAINTENANCE":
        return {
          card: "bg-amber-50 border-amber-500",
          text: "text-amber-700",
          table: "bg-amber-100 border-amber-600",
          cloth: "bg-amber-200",
        };
      default:
        return {
          card: "bg-gray-50 border-gray-500",
          text: "text-gray-700",
          table: "bg-gray-100 border-gray-600",
          cloth: "bg-gray-200",
        };
    }
  };

  const handleStartSession = (table: Table) => {
    // If table is occupied, find the active session and navigate directly to it
    if (table.status === "OCCUPIED") {
      const activeSession = activeSessions.find(
        (session: TableSession) => session.tableId === table.id
      );

      if (activeSession) {
        router.push(`/tables/${table.id}/sessions/${activeSession.id}`);
        return;
      }
    }

    // If table is available, proceed with the quick start dialog
    if (table.status === "AVAILABLE") {
      setSelectedTable(table);
      setQuickStartDialogOpen(true);
    } else {
      router.push(`/tables/${table.id}`);
    }
  };

  const handleRegularStartSession = (table: Table) => {
    setSelectedTable(table);
    setSessionDialogOpen(true);
  };

  const handleEdit = (table: Table) => {
    if (!isAdmin) return;
    setSelectedTable(table);
    setEditDialogOpen(true);
  };

  const handleCancelSession = async () => {
    if (selectedSessionId) {
      await cancelSessionMutation.mutateAsync(selectedSessionId);
      setIsCancelSessionAlertOpen(false);
      setSelectedSessionId(null);
    }
  };

  const handleMoveSession = (table: Table) => {
    const activeSession = activeSessions.find(
      (session: TableSession) => session.tableId === table.id
    );
    if (activeSession) {
      setSelectedTable(table);
      setSelectedSessionId(activeSession.id);
      setMoveSessionDialogOpen(true);
    }
  };

  const renderTableCard = (table: Table) => {
    const statusColors = getStatusColor(table.status);
    // Find active session for this table if it's occupied
    const activeSession =
      table.status === "OCCUPIED"
        ? activeSessions.find(
            (session: TableSession) => session.tableId === table.id
          )
        : null;

    return (
      <Card
        key={table.id}
        className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-105 h-52 ${
          table.status === "MAINTENANCE" ? "opacity-70" : ""
        } ${statusColors.card} border-2`}
        onClick={() => handleStartSession(table)}
      >
        <div className="flex flex-col p-4 h-full">
          <div className="flex justify-between items-start">
            <h3 className={`font-bold text-lg ${statusColors.text}`}>
              {table.name}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/tables/${table.id}`);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Ver Detalles
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(table);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Mesa
                  </DropdownMenuItem>
                )}
                {table.status === "AVAILABLE" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegularStartSession(table);
                      }}
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Iniciar Sesión
                    </DropdownMenuItem>
                  </>
                )}
                {table.status === "OCCUPIED" && activeSession && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/tables/${table.id}/sessions/${activeSession.id}`
                        );
                      }}
                    >
                      <StopCircle className="mr-2 h-4 w-4" />
                      Ver Sesión
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSession(table);
                      }}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Mover Sesión
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        const activeSession = activeSessions.find(
                          (session: TableSession) =>
                            session.tableId === table.id
                        );
                        if (activeSession) {
                          setSelectedSessionId(activeSession.id);
                          setIsCancelSessionAlertOpen(true);
                        }
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <StopCircle className="mr-2 h-4 w-4" />
                      Finalizar Sesión
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className={`text-sm font-medium ${statusColors.text}`}>
            {table.company?.name || "Empresa Desconocida"}
          </div>

          <div className="flex-1 flex items-center justify-center py-2">
            <div
              className={`w-36 h-24 ${statusColors.table} border-2 rounded-md flex items-center justify-center relative shadow-md`}
            >
              <div
                className={`w-32 h-20 ${statusColors.cloth} rounded-sm shadow-inner`}
              ></div>

              <div className="absolute w-3 h-3 rounded-full bg-black/70 -top-1 -left-1"></div>
              <div className="absolute w-3 h-3 rounded-full bg-black/70 -top-1 -right-1"></div>
              <div className="absolute w-3 h-3 rounded-full bg-black/70 bottom-[45%] -left-1.5"></div>
              <div className="absolute w-3 h-3 rounded-full bg-black/70 bottom-[45%] -right-1.5"></div>
              <div className="absolute w-3 h-3 rounded-full bg-black/70 -bottom-1 -left-1"></div>
              <div className="absolute w-3 h-3 rounded-full bg-black/70 -bottom-1 -right-1"></div>

              <div className="absolute w-1.5 h-1.5 rounded-full bg-white/70 bottom-[50%] left-[25%]"></div>
              <div className="absolute w-1.5 h-1.5 rounded-full bg-white/70 bottom-[50%] right-[25%]"></div>
              <div className="absolute w-1.5 h-1.5 rounded-full bg-white/70 bottom-[50%] left-[50%] transform -translate-x-1/2"></div>
            </div>
          </div>

          <div className="mt-auto flex justify-between items-center">
            <div
              className={`text-sm font-medium uppercase ${statusColors.text}`}
            >
              {table.status === "AVAILABLE"
                ? "CLIC PARA INICIAR"
                : table.status}
            </div>
            {table.hourlyRate ? (
              <div className={`text-sm font-medium ${statusColors.text}`}>
                {formatCurrency(table.hourlyRate)}/hr
              </div>
            ) : (
              <div className={`text-sm font-medium ${statusColors.text}`}>
                Sin tarifa
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array(8)
          .fill(null)
          .map((_, index) => (
            <Card key={index} className="h-44">
              <CardContent className="flex flex-col p-4 h-full">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <Skeleton className="h-4 w-40 mt-2" />
                <div className="flex-1 flex items-center justify-center">
                  <Skeleton className="h-16 w-24 rounded-lg" />
                </div>
                <div className="mt-auto flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-muted-foreground mb-4">
          No se encontraron mesas. Crea una nueva mesa para comenzar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table: Table) => renderTableCard(table))}
      </div>

      <SessionDialog
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
        table={selectedTable}
        onSuccess={() => {
          setSessionDialogOpen(false);
          setSelectedTable(null);
        }}
      />

      <QuickStartSessionDialog
        open={quickStartDialogOpen}
        onOpenChange={setQuickStartDialogOpen}
        table={selectedTable}
        onSuccess={() => {
          setQuickStartDialogOpen(false);
          setSelectedTable(null);
        }}
      />

      <TableDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        table={selectedTable}
        onSuccess={() => {
          setEditDialogOpen(false);
          setSelectedTable(null);
        }}
      />

      <MoveSessionDialog
        open={moveSessionDialogOpen}
        onOpenChange={setMoveSessionDialogOpen}
        sessionId={selectedSessionId || undefined}
        currentTableName={selectedTable?.name}
        currentTableId={selectedTable?.id}
        onSuccess={() => {
          setMoveSessionDialogOpen(false);
          setSelectedTable(null);
          setSelectedSessionId(null);
        }}
      />

      <AlertDialog
        open={isCancelSessionAlertOpen}
        onOpenChange={setIsCancelSessionAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto cancelará la sesión activa. No se aplicarán cargos. La mesa
              se marcará como disponible nuevamente.
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
    </>
  );
}
