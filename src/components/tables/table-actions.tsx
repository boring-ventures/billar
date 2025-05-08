"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash, AlertTriangle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableStatusForm } from "@/components/tables/table-status-form";
import { useTables } from "@/hooks/use-tables";
import { useSessions } from "@/hooks/use-sessions";
import { Table } from "@/types/table";
import { useCurrentUser } from "@/hooks/use-current-user";

interface TableActionsProps {
  table: Table;
}

export function TableActions({ table }: TableActionsProps) {
  const router = useRouter();
  const { deleteTable } = useTables();
  const { createSession, isSubmitting: isSessionSubmitting } = useSessions();
  const { currentUser, profile } = useCurrentUser();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const success = await deleteTable(table.id);
      if (success) {
        router.push("/tables");
      }
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleStartSession = async () => {
    await createSession(table.id);
  };

  // Use both currentUser and profile for compatibility
  const role = currentUser?.role || profile?.role;
  const canManageTable = role === "ADMIN" || role === "SUPERADMIN";
  const canStartSession = table.status === "AVAILABLE";

  // Determine if there are any controls to show
  const hasControls = canManageTable || canStartSession;

  if (!hasControls) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canStartSession && (
            <DropdownMenuItem
              className="cursor-pointer text-green-600"
              onClick={handleStartSession}
              disabled={isSessionSubmitting}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Session
            </DropdownMenuItem>
          )}

          {canStartSession && canManageTable && <DropdownMenuSeparator />}

          {canManageTable && (
            <>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setShowStatusDialog(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Change Status
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push(`/tables/${table.id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Details
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Table
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Table
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {table.name}? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Table Status</DialogTitle>
            <DialogDescription>
              Update the status of {table.name}
            </DialogDescription>
          </DialogHeader>
          <TableStatusForm
            tableId={table.id}
            currentStatus={table.status}
            onSuccess={() => setShowStatusDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
