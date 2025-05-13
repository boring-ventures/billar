"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useCancelTableSessionMutation } from "@/hooks/use-table-sessions-query";

interface SessionCancelDialogProps {
  sessionId: string;
  variant?:
    | "outline"
    | "destructive"
    | "default"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  buttonText?: string;
}

export function SessionCancelDialog({
  sessionId,
  variant = "outline",
  size = "sm",
  buttonText = "Cancel Session",
}: SessionCancelDialogProps) {
  const [open, setOpen] = useState(false);
  const cancelSessionMutation = useCancelTableSessionMutation();

  const handleCancel = () => {
    cancelSessionMutation.mutate(sessionId, {
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={cancelSessionMutation.isPending}
        >
          <X className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel table session?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will cancel the current session,
            release the table, and mark the session as cancelled.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, keep session</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            disabled={cancelSessionMutation.isPending}
          >
            {cancelSessionMutation.isPending
              ? "Cancelling..."
              : "Yes, cancel session"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
