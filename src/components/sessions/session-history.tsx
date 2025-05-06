"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  DollarSign,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableSession, useSessions } from "@/hooks/use-sessions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCost, formatDurationHuman } from "@/lib/format-duration";
import { SessionStatus } from "@prisma/client";

const statusColors = {
  ACTIVE: "bg-green-500",
  COMPLETED: "bg-blue-500",
  CANCELLED: "bg-red-500",
};

const statusIcons = {
  ACTIVE: <Clock className="h-4 w-4" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4" />,
  CANCELLED: <XCircle className="h-4 w-4" />,
};

interface SessionHistoryProps {
  tableId: string;
}

export function SessionHistory({ tableId }: SessionHistoryProps) {
  const router = useRouter();
  const { sessionHistory, fetchTableSessions, isLoading } = useSessions();

  useEffect(() => {
    fetchTableSessions(tableId);
  }, [tableId, fetchTableSessions]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>Loading session history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!sessionHistory || sessionHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>No sessions found for this table</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const calculateDuration = (session: TableSession) => {
    if (!session.endedAt) return null;

    const start = new Date(session.startedAt).getTime();
    const end = new Date(session.endedAt).getTime();
    const durationInSeconds = Math.floor((end - start) / 1000);

    return formatDurationHuman(durationInSeconds);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session History</CardTitle>
        <CardDescription>Previous sessions for this table</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessionHistory.map((session) => (
              <TableRow
                key={session.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  if (session.status === "ACTIVE") {
                    router.push(`/tables/${tableId}/session/${session.id}`);
                  }
                }}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(session.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(session.startedAt).toLocaleTimeString()}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {session.staff
                        ? `${session.staff.firstName || ""} ${
                            session.staff.lastName || ""
                          }`.trim() || "Staff"
                        : "Unknown"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {calculateDuration(session) || (
                    <span className="text-muted-foreground">In progress</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    {formatCost(session.totalCost)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {statusIcons[session.status]}
                    {session.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
