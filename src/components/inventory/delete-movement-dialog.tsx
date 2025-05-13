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
} from "@/components/ui/alert-dialog";
import { useStockMovements } from "@/hooks/use-stock-movements";

// Stock movement types from Prisma schema
type MovementType = "PURCHASE" | "SALE" | "ADJUSTMENT" | "RETURN" | "TRANSFER";

interface StockMovement {
  id: string;
  itemId: string;
  quantity: number;
  type: MovementType;
  costPrice: number | null;
  reason: string | null;
  reference: string | null;
  createdAt: string;
  createdBy: string | null;
  item?: {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
  };
}

interface DeleteMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: StockMovement | null;
  onSuccess?: () => void;
}

export function DeleteMovementDialog({
  open,
  onOpenChange,
  movement,
  onSuccess,
}: DeleteMovementDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteMovement } = useStockMovements(movement?.itemId);

  const handleDelete = async () => {
    if (!movement) return;

    setIsDeleting(true);

    try {
      await deleteMovement.mutateAsync(movement.id);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error deleting stock movement:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!movement) return null;

  // Only allow deleting ADJUSTMENT type movements
  if (movement.type !== "ADJUSTMENT") return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Stock Adjustment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this stock adjustment? This action
            cannot be undone and will affect the current stock level of the
            item.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
