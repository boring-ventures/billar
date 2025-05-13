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
import { MoreHorizontal, StopCircle, X, Eye } from "lucide-react";
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
import { SessionDialog } from "./session-dialog";
import { TableSessionsTableSkeleton } from "./table-sessions-table-skeleton";

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
  activeOnly = true,
}: TableSessionsTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>(
    activeOnly ? "ACTIVE" : "all"
  );
  const [isEndSessionAlertOpen, setIsEndSessionAlertOpen] = useState(false);
  const [isCancelSessionAlertOpen, setIsCancelSessionAlertOpen] =
    useState(false);
  const [selectedSession, setSelectedSession] =
    useState<SessionWithDuration | null>(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  // Update statusFilter when activeOnly prop changes
  useEffect(() => {
    setStatusFilter(activeOnly ? "ACTIVE" : "all");
  }, [activeOnly]);

  const { data: sessions = [], isLoading } = useTableSessionsQuery({
    status:
      statusFilter === "all"
        ? undefined
        : (statusFilter as SessionStatus | undefined),
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
      await endSessionMutation.mutateAsync(selectedSession.id);
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

  const columns: ColumnDef<SessionWithDuration>[] = [
    {
      accessorKey: "table.name",
      header: "Table",
      cell: ({ row }) => {
        const original = row.original;
        return (
          <div className="font-medium">{original.table?.name || "N/A"}</div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
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
      header: "Started",
      cell: ({ row }) => {
        const date = new Date(row.getValue("startedAt"));
        return <div>{date.toLocaleString()}</div>;
      },
    },
    {
      accessorKey: "endedAt",
      header: "Ended",
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
      header: "Duration",
      cell: ({ row }) => {
        return <div>{row.getValue("durationFormatted")}</div>;
      },
    },
    {
      accessorKey: "totalCost",
      header: "Cost",
      cell: ({ row }) => {
        const cost = row.getValue("totalCost") as number | null;
        return <div>{cost ? formatCurrency(cost) : "--"}</div>;
      },
    },
    {
      accessorKey: "staff",
      header: "Staff",
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
      header: "Actions",
      cell: ({ row }) => {
        const session = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/tables/${session.tableId}/sessions/${session.id}`
                  )
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>

              {session.status === "ACTIVE" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedSession(session);
                      setIsEndSessionAlertOpen(true);
                    }}
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    End Session
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedSession(session);
                      setIsCancelSessionAlertOpen(true);
                    }}
                    className="text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Session
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
      <SelectItem value="ACTIVE">Active</SelectItem>
    </>
  ) : (
    <>
      <SelectItem value="all">All Sessions</SelectItem>
      <SelectItem value="ACTIVE">Active</SelectItem>
      <SelectItem value="COMPLETED">Completed</SelectItem>
      <SelectItem value="CANCELLED">Cancelled</SelectItem>
    </>
  );

  const statusFilterElement = (
    <Select
      value={statusFilter}
      onValueChange={setStatusFilter}
      disabled={activeOnly}
    >
      <SelectTrigger className="w-full md:w-[180px]">
        <SelectValue placeholder="Filter by status" />
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
        addNewLabel="Start New Session"
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
            <AlertDialogTitle>End this session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the active session and calculate the final cost. The
              table will be marked as available again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndSession}
              disabled={endSessionMutation.isPending}
            >
              {endSessionMutation.isPending ? "Processing..." : "End Session"}
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
            <AlertDialogTitle>Cancel this session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the active session. No charges will be applied.
              The table will be marked as available again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSession}
              className="bg-destructive text-destructive-foreground"
              disabled={cancelSessionMutation.isPending}
            >
              {cancelSessionMutation.isPending
                ? "Processing..."
                : "Cancel Session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
