"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hourglass, AlertTriangle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { SessionTimer } from "@/components/sessions/session-timer";
import { useSessions } from "@/hooks/use-sessions";
import { formatCost } from "@/lib/format-duration";
import { SessionStatus } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface ActiveSessionProps {
  sessionId: string;
  initialData?: any;
}

export function ActiveSession({ sessionId, initialData }: ActiveSessionProps) {
  const router = useRouter();
  const {
    activeSession,
    fetchSessionById,
    endSession,
    cancelSession,
    isSubmitting,
    calculateCurrentCost,
    setSessionTime,
  } = useSessions();

  const [currentCost, setCurrentCost] = useState<number>(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Load session data on mount if not provided
  useState(() => {
    if (!initialData && sessionId) {
      fetchSessionById(sessionId);
    }
  });

  const session = activeSession || initialData;

  if (!session) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Loading Session...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const handleTimeUpdate = (elapsedSeconds: number) => {
    setSessionTime(elapsedSeconds);

    // Calculate current cost
    if (session.table.hourlyRate) {
      const cost = calculateCurrentCost(
        session.table.hourlyRate,
        elapsedSeconds
      );
      setCurrentCost(cost);
    }
  };

  const handleEndSession = async () => {
    setShowEndDialog(false);
    await endSession(sessionId);
  };

  const handleCancelSession = async () => {
    setShowCancelDialog(false);
    await cancelSession(sessionId);
  };

  // Only show controls if session is active
  const isActive = session.status === "ACTIVE";

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                {session.table.name} - Active Session
              </CardTitle>
              <CardDescription>
                Started by{" "}
                {session.staff
                  ? `${session.staff.firstName || ""} ${session.staff.lastName || ""}`.trim() ||
                    "Staff"
                  : "Unknown"}{" "}
                at {new Date(session.startedAt).toLocaleTimeString()}
              </CardDescription>
            </div>
            <div className="flex items-center">
              <SessionTimer
                startTime={session.startedAt}
                onTimeUpdate={handleTimeUpdate}
                isActive={isActive}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center gap-2">
              <Hourglass className="h-5 w-5 text-muted-foreground" />
              <span>
                Started: {new Date(session.startedAt).toLocaleString()}
              </span>
            </div>
            {session.table.hourlyRate && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span>
                  Rate: ${session.table.hourlyRate}/hour (Current: $
                  {formatCost(currentCost)})
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Orders section would go here when implemented */}
          <div className="text-sm text-muted-foreground">
            {isActive ? (
              <p>The timer will continue running until the session is ended.</p>
            ) : (
              <p>This session has been {session.status.toLowerCase()}.</p>
            )}
          </div>
        </CardContent>
        {isActive && (
          <CardFooter className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(true)}
              disabled={isSubmitting}
            >
              Cancel Session
            </Button>
            <Button
              onClick={() => setShowEndDialog(true)}
              disabled={isSubmitting}
            >
              End Session
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* End Session Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this session? This will mark the
              table as available.
            </DialogDescription>
          </DialogHeader>
          {session.table.hourlyRate && (
            <div className="py-4">
              <p className="text-sm font-medium mb-1">Session Summary</p>
              <div className="flex justify-between text-sm">
                <span>Duration:</span>
                <SessionTimer startTime={session.startedAt} isActive={false} />
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Total Cost:</span>
                <span>${formatCost(currentCost)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEndSession} disabled={isSubmitting}>
              End Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Session Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Session
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this session? This will free up
              the table without saving any charges.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSession}
              disabled={isSubmitting}
            >
              Cancel Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
