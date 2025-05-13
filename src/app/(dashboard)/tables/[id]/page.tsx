"use client";

import { useParams, useRouter } from "next/navigation";
import { useTableByIdQuery } from "@/hooks/use-tables-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Play } from "lucide-react";
import { TableStatus } from "@prisma/client";
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
import { useCreateTableSessionMutation } from "@/hooks/use-table-sessions-query";
import { useState } from "react";

export default function TableDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params?.id as string;
  const [activeTab, setActiveTab] = useState("sessions");

  const { data: table, isLoading } = useTableByIdQuery(tableId);
  const createSessionMutation = useCreateTableSessionMutation();

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

    createSessionMutation.mutate({
      tableId: tableId,
    });
  };

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
    return (
      <div className="p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Loading table details...
          </h2>
        </div>
      </div>
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
    </div>
  );
}
