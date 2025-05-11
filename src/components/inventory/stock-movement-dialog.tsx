"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateStockMovement, InventoryItem } from "@/hooks/use-inventory";
import { MovementType } from "@prisma/client";

const movementFormSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  type: z.enum(["PURCHASE", "SALE", "ADJUSTMENT", "RETURN", "TRANSFER"], {
    required_error: "Movement type is required",
  }),
  costPrice: z.coerce.number().optional(),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

type MovementFormValues = z.infer<typeof movementFormSchema>;

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}

export function StockMovementDialog({
  open,
  onOpenChange,
  item,
}: StockMovementDialogProps) {
  const createStockMovementMutation = useCreateStockMovement();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      itemId: "",
      quantity: 1,
      type: "PURCHASE" as MovementType,
      costPrice: undefined,
      reason: "",
      reference: "",
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        itemId: item.id,
        quantity: 1,
        type: "PURCHASE" as MovementType,
        costPrice: undefined,
        reason: "",
        reference: "",
      });
    }
  }, [item, form]);

  const onSubmit = async (data: MovementFormValues) => {
    setIsSubmitting(true);
    try {
      await createStockMovementMutation.mutateAsync(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Error recording stock movement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const movementTypes = [
    { value: "PURCHASE", label: "Purchase" },
    { value: "SALE", label: "Sale" },
    { value: "ADJUSTMENT", label: "Adjustment" },
    { value: "RETURN", label: "Return" },
    { value: "TRANSFER", label: "Transfer" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Movement Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select movement type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {movementTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Movement quantity"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.valueAsNumber);
                      }}
                    />
                  </FormControl>
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
                      step="0.01"
                      placeholder="Cost price per unit"
                      {...field}
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? undefined
                            : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Reason for the movement"
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
                      placeholder="Reference number, invoice, etc."
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
                type="submit"
                disabled={isSubmitting || createStockMovementMutation.isPending}
              >
                {isSubmitting || createStockMovementMutation.isPending
                  ? "Recording..."
                  : "Record Movement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
