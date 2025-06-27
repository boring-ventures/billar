"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useTableSessionByIdQuery,
  useEndTableSessionMutation,
  TableSession,
} from "@/hooks/use-table-sessions-query";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  StopCircle,
  ShoppingCart,
  User,
  ArrowRight,
} from "lucide-react";
import { SessionStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { SessionOrdersList } from "@/components/tables/session-orders-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { SessionCancelDialog } from "@/components/tables/session-cancel-dialog";
import { SessionDetailsSkeleton } from "@/components/tables/session-details-skeleton";
import { SessionOrderCreator } from "@/components/tables/session-order-creator";
import { SessionTrackedItemsList } from "@/components/tables/session-tracked-items-list";
import { EndSessionDialog } from "@/components/tables/end-session-dialog";
import { MoveSessionDialog } from "@/components/tables/move-session-dialog";

export default function TableSessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const { data: session, isLoading } = useTableSessionByIdQuery(sessionId);
  const endSessionMutation = useEndTableSessionMutation({ skipRedirect: true });

  const [duration, setDuration] = useState<string>("");
  const [currentCost, setCurrentCost] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [moveSessionDialogOpen, setMoveSessionDialogOpen] = useState(false);

  // Calculate and update the session duration and cost
  useEffect(() => {
    if (!session) return;

    setIsActive(session.status === "ACTIVE");

    const updateDurationAndCost = () => {
      const start = new Date(session.startedAt);
      const end = session.endedAt ? new Date(session.endedAt) : new Date();
      const durationMs = end.getTime() - start.getTime();
      setDuration(formatDuration(durationMs));

      // Calculate current cost for active sessions
      if (session.status === "ACTIVE" && session.table?.hourlyRate) {
        const hourlyRate = session.table.hourlyRate;
        const hoursElapsed = durationMs / (1000 * 60 * 60);
        const calculatedCost = hourlyRate * hoursElapsed;
        setCurrentCost(calculatedCost);
      } else if (session.totalCost) {
        setCurrentCost(session.totalCost);
      } else {
        setCurrentCost(null);
      }
    };

    updateDurationAndCost();

    // Only set interval if the session is active
    let interval: NodeJS.Timeout | null = null;
    if (session.status === "ACTIVE") {
      interval = setInterval(updateDurationAndCost, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session]);

  const handleBack = () => {
    router.back();
  };

  const handleMoveSession = () => {
    setMoveSessionDialogOpen(true);
  };

  // Handle successful session ending with proper redirection
  const handleSessionEnded = (endedSession: TableSession) => {
    // Check if we need to redirect to POS for payment
    const hasSessionCost = endedSession.totalCost && endedSession.totalCost > 0;
    const hasTrackedItems =
      endedSession.trackedItems && endedSession.trackedItems.length > 0;

    if (hasSessionCost || hasTrackedItems) {
      // Redirect to POS with the session ID as a parameter
      router.push(`/pos?tab=new&sessionId=${endedSession.id}`);
    } else {
      // Just go back to the table detail page if no cost and no items
      router.push(`/tables/${endedSession.tableId}`);
    }
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
            Sesión no encontrada
          </h2>
        </div>
        <Button onClick={handleBack} className="mt-4" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
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
            Volver
          </Button>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Sesión para {session.table?.name}
          </h2>
          <Badge className={getStatusColor(session.status)}>
            {session.status}
          </Badge>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {session.status === "ACTIVE" && (
            <>
              <Button size="sm" variant="outline" onClick={handleMoveSession}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Mover Mesa
              </Button>
              <EndSessionDialog
                sessionId={sessionId}
                sessionStartTime={new Date(session.startedAt)}
                onSessionEnded={handleSessionEnded}
              >
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={endSessionMutation.isPending}
                >
                  <StopCircle className="mr-2 h-4 w-4" />
                  Finalizar Sesión
                </Button>
              </EndSessionDialog>
              <SessionCancelDialog sessionId={sessionId} />
            </>
          )}
        </div>
      </div>

      {isActive && (
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <Clock className="h-4 w-4" />
          <AlertTitle>Sesión Activa</AlertTitle>
          <AlertDescription>
            Esta sesión está actualmente activa y el tiempo está corriendo.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Duración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{duration}</p>
            <p className="text-sm text-muted-foreground">
              Iniciada: {new Date(session.startedAt).toLocaleString()}
            </p>
            {session.endedAt && (
              <p className="text-sm text-muted-foreground">
                Finalizada: {new Date(session.endedAt).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Costo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {currentCost !== null ? formatCurrency(currentCost) : "--"}
            </p>
            <p className="text-sm text-muted-foreground">
              Tarifa por Hora:{" "}
              {session.table?.hourlyRate
                ? formatCurrency(session.table.hourlyRate)
                : "No establecida"}
            </p>
            {isActive && session.table?.hourlyRate && (
              <p className="text-xs text-amber-600 mt-1">
                Costo actualizado en tiempo real
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-medium">
              {session.staff
                ? `${session.staff.firstName} ${session.staff.lastName}`
                : "No asignado"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Only show tracking component when session is active */}
      {session.status === "ACTIVE" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Artículos de la Sesión
            </CardTitle>
            <CardDescription>
              Seguimiento y gestión de artículos consumidos durante esta sesión
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-md font-medium mb-2">Añadir Artículos</h3>
              <SessionOrderCreator
                tableSessionId={session.id}
                tableId={session.tableId}
                companyId={
                  session.table?.company?.id || session.table?.companyId || ""
                }
              />
            </div>

            <Separator className="my-4" />

            <div>
              <h3 className="text-md font-medium mb-2">
                Artículos Registrados
              </h3>
              <SessionTrackedItemsList
                sessionId={sessionId}
                showHeading={false}
                showCard={false}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show tracked items for non-active sessions */}
      {session.status !== "ACTIVE" && (
        <SessionTrackedItemsList sessionId={sessionId} />
      )}

      {/* Only show orders for completed or cancelled sessions */}
      {session.status !== "ACTIVE" && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Pedidos
          </h3>
          <SessionOrdersList sessionId={sessionId} />
        </div>
      )}

      <MoveSessionDialog
        open={moveSessionDialogOpen}
        onOpenChange={setMoveSessionDialogOpen}
        sessionId={sessionId}
        currentTableName={session?.table?.name}
        currentTableId={session?.tableId}
        onSuccess={() => {
          setMoveSessionDialogOpen(false);
        }}
      />
    </div>
  );
}
