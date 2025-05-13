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
import { useInventoryCategories } from "@/hooks/use-inventory-categories";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

// Define the interface for the inventory category
interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  items?: {
    id: string;
    name: string;
    quantity: number;
  }[];
}

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: InventoryCategory | null;
  onSuccess?: () => void;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteCategory } = useInventoryCategories(category?.companyId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!category) return;

    setIsDeleting(true);

    try {
      await deleteCategory.mutateAsync(category.id);

      // Invalidate all inventory categories queries
      queryClient.invalidateQueries({
        queryKey: ["inventoryCategories"],
      });

      onOpenChange(false);

      toast({
        title: "Success",
        description: `Category "${category.name}" was deleted successfully`,
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!category) return null;

  // Check if category has items
  const hasItems = category.items && category.items.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          {hasItems ? (
            <AlertDialogDescription className="text-destructive">
              Cannot delete &quot;{category.name}&quot; because it contains
              items. Please move or delete all items in this category first.
            </AlertDialogDescription>
          ) : (
            <AlertDialogDescription>
              Are you sure you want to delete the category &quot;{category.name}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          {!hasItems && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
