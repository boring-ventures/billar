"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SessionStatus, TableSession } from "@prisma/client";
import { Calendar, Clock } from "lucide-react";

interface TableSessionsHistoryProps {
  tableId: string;
}

// Extend the TableSession to include the staff object
interface ExtendedTableSession extends TableSession {
  staff?: {
    firstName?: string;
    lastName?: string;
  } | null;
}

export function TableSessionsHistory({ tableId }: TableSessionsHistoryProps) {
  const router = useRouter();

  const { data: sessions = [], isLoading } = useQuery<ExtendedTableSession[]>({
    queryKey: ["tableSessions", { tableId }],
    queryFn: async () => {
      const response = await fetch(`/api/table-sessions?tableId=${tableId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      return response.json();
    },
  });

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/15 text-green-600";
      case "COMPLETED":
        return "bg-blue-500/15 text-blue-600";
      case "CANCELLED":
        return "bg-red-500/15 text-red-600";
      default:
        return "bg-gray-500/15 text-gray-600";
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading session history...</div>;
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            No session history found for this table.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session: ExtendedTableSession) => {
        const startDate = new Date(session.startedAt);
        const endDate = session.endedAt ? new Date(session.endedAt) : null;
        const durationMs = endDate
          ? endDate.getTime() - startDate.getTime()
          : new Date().getTime() - startDate.getTime();

        return (
          <Card key={session.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(session.status)}>
                    {session.status}
                  </Badge>
                  <CardTitle className="text-lg">
                    {startDate.toLocaleDateString()}
                  </CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/tables/${tableId}/sessions/${session.id}`)
                  }
                >
                  View Details
                </Button>
              </div>
              <CardDescription>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  {startDate.toLocaleTimeString()}
                  {endDate && ` - ${endDate.toLocaleTimeString()}`}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Duration
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDuration(durationMs)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Cost
                  </p>
                  <p>
                    {session.totalCost
                      ? formatCurrency(Number(session.totalCost))
                      : "--"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Staff
                  </p>
                  <p>
                    {session.staff
                      ? `${session.staff.firstName || ""} ${session.staff.lastName || ""}`.trim()
                      : "Not assigned"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
