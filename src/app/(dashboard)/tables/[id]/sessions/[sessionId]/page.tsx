"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useTableSessionByIdQuery,
  useEndTableSessionMutation,
} from "@/hooks/use-table-sessions-query";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  StopCircle,
  ShoppingCart,
  User,
} from "lucide-react";
import { SessionStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { SessionOrdersList } from "@/components/tables/session-orders-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { SessionCancelDialog } from "@/components/tables/session-cancel-dialog";
import { SessionDetailsSkeleton } from "@/components/tables/session-details-skeleton";
import { SessionOrderCreator } from "@/components/tables/session-order-creator";
import { SessionTrackedItemsList } from "@/components/tables/session-tracked-items-list";

export default function TableSessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const { data: session, isLoading } = useTableSessionByIdQuery(sessionId);
  const endSessionMutation = useEndTableSessionMutation();

  const [duration, setDuration] = useState<string>("");
  const [isActive, setIsActive] = useState(false);

  // Calculate and update the session duration
  useEffect(() => {
    if (!session) return;

    setIsActive(session.status === "ACTIVE");

    const updateDuration = () => {
      const start = new Date(session.startedAt);
      const end = session.endedAt ? new Date(session.endedAt) : new Date();
      const durationMs = end.getTime() - start.getTime();
      setDuration(formatDuration(durationMs));
    };

    updateDuration();

    // Only set interval if the session is active
    let interval: NodeJS.Timeout | null = null;
    if (session.status === "ACTIVE") {
      interval = setInterval(updateDuration, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session]);

  const handleBack = () => {
    router.back();
  };

  const handleEndSession = () => {
    if (session?.status !== "ACTIVE") return;
    endSessionMutation.mutate(sessionId);
  };

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
    return <SessionDetailsSkeleton />;
  }

  if (!session) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Session not found
          </h2>
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
            Session for {session.table?.name}
          </h2>
          <Badge className={getStatusColor(session.status)}>
            {session.status}
          </Badge>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {session.status === "ACTIVE" && (
            <>
              <Button
                onClick={handleEndSession}
                size="sm"
                variant="destructive"
                disabled={endSessionMutation.isPending}
              >
                <StopCircle className="mr-2 h-4 w-4" />
                End Session
              </Button>
              <SessionCancelDialog sessionId={sessionId} />
            </>
          )}
        </div>
      </div>

      {isActive && (
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <Clock className="h-4 w-4" />
          <AlertTitle>Active Session</AlertTitle>
          <AlertDescription>
            This session is currently active and the timer is running.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{duration}</p>
            <p className="text-sm text-muted-foreground">
              Started: {new Date(session.startedAt).toLocaleString()}
            </p>
            {session.endedAt && (
              <p className="text-sm text-muted-foreground">
                Ended: {new Date(session.endedAt).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {session.totalCost ? formatCurrency(session.totalCost) : "--"}
            </p>
            <p className="text-sm text-muted-foreground">
              Hourly Rate:{" "}
              {session.table?.hourlyRate
                ? formatCurrency(session.table.hourlyRate)
                : "Not set"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-medium">
              {session.staff
                ? `${session.staff.firstName} ${session.staff.lastName}`
                : "Not assigned"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Only show tracking component when session is active */}
      {session.status === "ACTIVE" && (
        <SessionOrderCreator
          tableSessionId={session.id}
          tableId={session.tableId}
          companyId={
            session.table?.company?.id || session.table?.companyId || ""
          }
        />
      )}

      {/* Show tracked items without duplicate heading */}
      <SessionTrackedItemsList sessionId={sessionId} />

      {/* Only show orders for completed or cancelled sessions */}
      {session.status !== "ACTIVE" && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Orders
          </h3>
          <SessionOrdersList sessionId={sessionId} />
        </div>
      )}
    </div>
  );
}
