"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { TableStatus } from "@prisma/client";
import {
  useTablesQuery,
  useDeleteTableMutation,
  Table as TableType,
} from "@/hooks/use-tables-query";
import {
  useTableSessionsQuery,
  useEndTableSessionMutation,
  useCancelTableSessionMutation,
} from "@/hooks/use-table-sessions-query";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/tables/table-skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "./data-table";
import { formatCurrency } from "@/lib/utils";
import {
  MoreHorizontal,
  Edit,
  Trash,
  Eye,
  PlayCircle,
  StopCircle,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { TableDialog } from "./table-dialog";
import { QuickStartSessionDialog } from "./quick-start-session-dialog";

export function TablesTable() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isEndSessionAlertOpen, setIsEndSessionAlertOpen] = useState(false);
  const [isCancelSessionAlertOpen, setIsCancelSessionAlertOpen] =
    useState(false);
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [quickStartDialogOpen, setQuickStartDialogOpen] = useState(false);

  const { data: tables = [], isLoading } = useTablesQuery({
    status:
      statusFilter === "all"
        ? undefined
        : (statusFilter as TableStatus | undefined),
    query: searchQuery,
  });

  // Get active sessions to find the session ID for the currently selected table
  const { data: activeSessions = [] } = useTableSessionsQuery({
    status: "ACTIVE",
  });

  const deleteTableMutation = useDeleteTableMutation();
  const endSessionMutation = useEndTableSessionMutation();
  const cancelSessionMutation = useCancelTableSessionMutation();

  const handleDelete = async () => {
    if (selectedTable) {
      await deleteTableMutation.mutateAsync(selectedTable.id);
      setIsDeleteAlertOpen(false);
    }
  };

  const handleEndSession = async () => {
    if (selectedTable) {
      const session = activeSessions.find(
        (s: { tableId: string; id: string }) => s.tableId === selectedTable.id
      );
      if (session) {
        await endSessionMutation.mutateAsync(session.id);
        setIsEndSessionAlertOpen(false);
      }
    }
  };

  const handleCancelSession = async () => {
    if (selectedTable) {
      const session = activeSessions.find(
        (s: { tableId: string; id: string }) => s.tableId === selectedTable.id
      );
      if (session) {
        await cancelSessionMutation.mutateAsync(session.id);
        setIsCancelSessionAlertOpen(false);
      }
    }
  };

  const handleCreateNewTable = () => {
    setSelectedTable(null);
    setTableDialogOpen(true);
  };

  const handleEditTable = (table: TableType) => {
    setSelectedTable(table);
    setTableDialogOpen(true);
  };

  const handleStartSession = (table: TableType) => {
    setSelectedTable(table);
    setQuickStartDialogOpen(true);
  };

  const columns: ColumnDef<TableType>[] = [
    {
      accessorKey: "name",
      header: "Nombre de Mesa",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("status") as TableStatus;
        let badgeClass = "";

        switch (status) {
          case "AVAILABLE":
            badgeClass = "bg-green-500/15 text-green-600";
            break;
          case "OCCUPIED":
            badgeClass = "bg-red-500/15 text-red-600";
            break;
          case "RESERVED":
            badgeClass = "bg-blue-500/15 text-blue-600";
            break;
          case "MAINTENANCE":
            badgeClass = "bg-amber-500/15 text-amber-600";
            break;
        }

        return <Badge className={badgeClass}>{status}</Badge>;
      },
    },
    {
      accessorKey: "company.name",
      header: "Empresa",
      cell: ({ row }) => {
        const original = row.original;
        return <div>{original.company?.name || "N/A"}</div>;
      },
    },
    {
      accessorKey: "hourlyRate",
      header: "Tarifa por Hora",
      cell: ({ row }) => {
        const hourlyRate = row.getValue("hourlyRate") as number | null;
        return <div>{hourlyRate ? formatCurrency(hourlyRate) : "N/A"}</div>;
      },
    },
    {
      accessorKey: "_count.sessions",
      header: "Sesiones",
      cell: ({ row }) => {
        const original = row.original;
        return <div>{original._count?.sessions || 0}</div>;
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const table = row.original;

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
                onClick={() => router.push(`/tables/${table.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditTable(table)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {table.status === "AVAILABLE" && (
                <DropdownMenuItem onClick={() => handleStartSession(table)}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </DropdownMenuItem>
              )}
              {table.status === "OCCUPIED" && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      // Find active session for this table
                      const session = activeSessions.find(
                        (s: { tableId: string; id: string }) =>
                          s.tableId === table.id
                      );
                      if (session) {
                        router.push(
                          `/tables/${table.id}/sessions/${session.id}`
                        );
                      }
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Sesión Activa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedTable(table);
                      setIsEndSessionAlertOpen(true);
                    }}
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Finalizar Sesión
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedTable(table);
                      setIsCancelSessionAlertOpen(true);
                    }}
                    className="text-red-600"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar Sesión
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTable(table);
                  setIsDeleteAlertOpen(true);
                }}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return <TableSkeleton columnCount={6} />;
  }

  const statusFilterElement = (
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-full md:w-[180px]">
        <SelectValue placeholder="Filtrar por estado" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los Estados</SelectItem>
        <SelectItem value="AVAILABLE">Disponible</SelectItem>
        <SelectItem value="OCCUPIED">Ocupada</SelectItem>
        <SelectItem value="RESERVED">Reservada</SelectItem>
        <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={tables}
        onSearch={setSearchQuery}
        searchPlaceholder="Buscar mesas..."
        onAddNew={handleCreateNewTable}
        addNewLabel="Añadir Nueva Mesa"
        statusFilter={statusFilterElement}
      />

      <TableDialog
        open={tableDialogOpen}
        onOpenChange={setTableDialogOpen}
        table={selectedTable}
        onSuccess={() => {
          // Refresh the data
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

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              mesa y todos sus datos de nuestros servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={deleteTableMutation.isPending}
            >
              {deleteTableMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </>
  );
}
