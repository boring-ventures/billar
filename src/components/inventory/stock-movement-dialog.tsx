"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStockMovements } from "@/hooks/use-stock-movements";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

const formSchema = z.object({
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  costPrice: z.string().optional().default(""),
  reason: z.string().optional().default(""),
  reference: z.string().optional().default(""),
});

type FormValues = z.infer<typeof formSchema>;

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
  type: "PURCHASE" | "SALE" | "ADJUSTMENT";
  onSuccess?: () => void;
}

export function StockMovementDialog({
  open,
  onOpenChange,
  item,
  type,
  onSuccess,
}: StockMovementDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createMovement } = useStockMovements(item?.id);
  const queryClient = useQueryClient();

  const getTypeTitle = () => {
    switch (type) {
      case "PURCHASE":
        return "Add Stock";
      case "SALE":
        return "Remove Stock";
      case "ADJUSTMENT":
        return "Adjust Stock";
      default:
        return "Record Stock Movement";
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      costPrice: "",
      reason: "",
      reference: "",
    },
  });

  // Reset form when dialog opens/closes or type changes
  useEffect(() => {
    if (open) {
      form.reset({
        quantity: 1,
        costPrice: "",
        reason: "",
        reference: "",
      });
    }
  }, [open, form, type]);

  const onSubmit = async (data: FormValues) => {
    if (!item) return;

    setIsSubmitting(true);

    try {
      // For sales, we need to adjust the quantity to be negative
      const adjustedQuantity = type === "SALE" ? -data.quantity : data.quantity;

      // Convert costPrice from string to number or null
      const costPrice =
        data.costPrice && data.costPrice.trim() !== ""
          ? parseFloat(data.costPrice)
          : null;

      await createMovement.mutateAsync({
        itemId: item.id,
        quantity: adjustedQuantity,
        type,
        costPrice,
        reason:
          data.reason && data.reason.trim() !== "" ? data.reason : undefined,
        reference:
          data.reference && data.reference.trim() !== ""
            ? data.reference
            : undefined,
      });

      // Invalidate queries to ensure data is refreshed
      queryClient.invalidateQueries({
        queryKey: ["stockMovements", item.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["inventoryItems"],
      });

      if (onSuccess) {
        onSuccess();
      } else {
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error recording stock movement:", error);

      // Display the error message to the user
      const errorMessage =
        error.response?.data?.error || "Failed to record stock movement";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTypeTitle()}</DialogTitle>
          <DialogDescription>
            {`Record a${type === "PURCHASE" ? "n" : ""} ${type.toLowerCase()} for "${item.name}".`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        {...field}
                        value={field.value || 1}
                      />
                    </FormControl>
                    <FormDescription>
                      {type === "SALE" ? "Units to remove" : "Units to add"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reason for this stock movement"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Order number, invoice number, etc."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Recording..." : "Record Movement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
