"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, User } from "lucide-react";

interface TableActivityHistoryProps {
  tableId: string;
}

export function TableActivityHistory({ tableId }: TableActivityHistoryProps) {
  const { data: activityLogs = [], isLoading } = useQuery({
    queryKey: ["tableActivityLogs", tableId],
    queryFn: async () => {
      // This would be a real API call in a complete implementation
      // For now, we'll use the data returned from the table details endpoint
      const response = await fetch(`/api/tables/${tableId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch table details");
      }
      const data = await response.json();
      return data.activityLogs || [];
    },
  });

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500/15 text-green-600";
      case "OCCUPIED":
        return "bg-red-500/15 text-red-600";
      case "RESERVED":
        return "bg-blue-500/15 text-blue-600";
      case "MAINTENANCE":
        return "bg-amber-500/15 text-amber-600";
      default:
        return "bg-gray-500/15 text-gray-600";
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading activity logs...</div>;
  }

  if (activityLogs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            No activity logs found for this table.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {activityLogs.map((log: any, index: number) => (
              <div key={log.id} className="relative pl-8">
                {/* Timeline connector */}
                {index < activityLogs.length - 1 && (
                  <div className="absolute left-3 top-8 bottom-0 w-px bg-border" />
                )}

                {/* Timeline dot */}
                <div className="absolute left-0 top-1 h-6 w-6 rounded-full border border-border bg-background flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-center text-sm gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {new Date(log.changedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(log.previousStatus)}>
                      {log.previousStatus}
                    </Badge>
                    <span>→</span>
                    <Badge className={getStatusColor(log.newStatus)}>
                      {log.newStatus}
                    </Badge>
                  </div>

                  {log.notes && <p className="text-sm mt-1">{log.notes}</p>}

                  {log.changedBy && (
                    <div className="flex items-center text-sm gap-2 mt-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {log.changedBy.firstName} {log.changedBy.lastName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
