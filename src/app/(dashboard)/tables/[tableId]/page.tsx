"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TableStatus } from "@prisma/client";
import { useTables } from "@/hooks/use-tables";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSessions } from "@/hooks/use-sessions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TableWithDetails,
  TABLE_STATUS_LABELS,
  TABLE_STATUS_COLORS,
} from "@/types/table";
import {
  Edit,
  ArrowLeft,
  CalendarRange,
  Clock,
  Wrench,
  History,
  MoreHorizontal,
  PlayCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TableStatusForm } from "@/components/tables/table-status-form";
import { Separator } from "@/components/ui/separator";
import { TableActions } from "@/components/tables/table-actions";
import { TableDetailsSkeleton } from "@/components/tables/tables-skeleton";
import { SessionHistory } from "@/components/sessions/session-history";

export default function TableDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;
  const { profile } = useCurrentUser();
  const [tableDetails, setTableDetails] = useState<TableWithDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const { createSession, isSubmitting: isSessionSubmitting } = useSessions();

  const canEditTable =
    profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";

  const canStartSession = tableDetails?.status === "AVAILABLE";

  useEffect(() => {
    const loadTableDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tables/${tableId}`);

        if (response.ok) {
          const data = await response.json();
          setTableDetails(data);
        } else {
          // If table not found or access denied, redirect back to tables list
          router.push("/tables");
        }
      } catch (error) {
        console.error("Error loading table details:", error);
        router.push("/tables");
      } finally {
        setIsLoading(false);
      }
    };

    if (tableId) {
      loadTableDetails();
    }
  }, [tableId, router]);

  const handleStartSession = async () => {
    await createSession(tableId);
  };

  if (isLoading || !tableDetails) {
    return <TableDetailsSkeleton />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={tableDetails.name}
          description="Table details and management"
        />

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/tables")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tables
          </Button>

          {canStartSession && (
            <Button onClick={handleStartSession} disabled={isSessionSubmitting}>
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Session
            </Button>
          )}

          <TableActions table={tableDetails} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Table Information</CardTitle>
            <CardDescription>Basic details about this table</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Status</p>
              <Badge
                variant="outline"
                className={`mt-1 ${TABLE_STATUS_COLORS[tableDetails.status]}`}
              >
                {TABLE_STATUS_LABELS[tableDetails.status]}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium">Hourly Rate</p>
              <p className="text-xl font-bold">
                {tableDetails.hourlyRate
                  ? formatCurrency(tableDetails.hourlyRate)
                  : "Not set"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(tableDetails.createdAt)}
              </p>
            </div>

            <Separator />

            <TableStatusForm
              tableId={tableId}
              currentStatus={tableDetails.status}
              onStatusChange={() => {
                // Reload table details after status change
                window.location.reload();
              }}
            />
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Tabs defaultValue="activity">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="activity">
                <History className="h-4 w-4 mr-2" />
                Activity Log
              </TabsTrigger>
              <TabsTrigger value="maintenance">
                <Wrench className="h-4 w-4 mr-2" />
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="sessions">
                <Clock className="h-4 w-4 mr-2" />
                Sessions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="border rounded-md">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>
                    Status changes and activity for this table
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tableDetails.activityLogs.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">
                      No activity logs found
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {tableDetails.activityLogs.map((log) => (
                        <div
                          key={log.id}
                          className="border-b pb-3 last:border-0"
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">
                                Status changed from{" "}
                                <Badge
                                  variant="outline"
                                  className={
                                    TABLE_STATUS_COLORS[log.previousStatus]
                                  }
                                >
                                  {TABLE_STATUS_LABELS[log.previousStatus]}
                                </Badge>{" "}
                                to{" "}
                                <Badge
                                  variant="outline"
                                  className={TABLE_STATUS_COLORS[log.newStatus]}
                                >
                                  {TABLE_STATUS_LABELS[log.newStatus]}
                                </Badge>
                              </p>
                              {log.notes && (
                                <p className="text-sm mt-1 text-muted-foreground">
                                  Note: {log.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(log.changedAt)}
                            </div>
                          </div>

                          {log.changedBy && (
                            <p className="text-sm mt-1 text-muted-foreground">
                              By: {log.changedBy.firstName}{" "}
                              {log.changedBy.lastName}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="border rounded-md">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Records</CardTitle>
                  <CardDescription>
                    Maintenance history and scheduled maintenance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tableDetails.maintenances.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">
                      No maintenance records found
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {tableDetails.maintenances.map((maintenance) => (
                        <div
                          key={maintenance.id}
                          className="border-b pb-3 last:border-0"
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">
                                {maintenance.description || "Maintenance"}
                              </p>
                              {maintenance.cost && (
                                <p className="text-sm mt-1">
                                  Cost: {formatCurrency(maintenance.cost)}
                                </p>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(maintenance.maintenanceAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessions" className="border rounded-md">
              <SessionHistory tableId={tableId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
