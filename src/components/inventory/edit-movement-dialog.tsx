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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const formSchema = z.object({
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  costPrice: z.coerce.number().min(0).optional(),
  reason: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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

interface EditMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: StockMovement | null;
  onSuccess?: () => void;
}

export function EditMovementDialog({
  open,
  onOpenChange,
  movement,
  onSuccess,
}: EditMovementDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateMovement } = useStockMovements(movement?.itemId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      costPrice: undefined,
      reason: "",
    },
  });

  // Reset form when dialog opens/closes or movement changes
  useEffect(() => {
    if (open && movement) {
      form.reset({
        quantity: Math.abs(movement.quantity), // Always display positive value
        costPrice: movement.costPrice || undefined,
        reason: movement.reason || "",
      });
    }
  }, [open, movement, form]);

  const onSubmit = async (data: FormValues) => {
    if (!movement) return;

    setIsSubmitting(true);

    try {
      await updateMovement.mutateAsync({
        id: movement.id,
        quantity: data.quantity,
        reason: data.reason || undefined,
        costPrice: data.costPrice,
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error updating stock movement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!movement) return null;

  // Only allow editing ADJUSTMENT type movements
  if (movement.type !== "ADJUSTMENT") return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Ajuste de Stock</DialogTitle>
          <DialogDescription>
            Modifica los detalles del registro de ajuste de stock.
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
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" step="1" {...field} />
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
                    <FormLabel>Precio de Costo (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          // Handle empty string case
                          const value = e.target.value;
                          if (value === "") {
                            field.onChange(undefined);
                          } else {
                            field.onChange(e);
                          }
                        }}
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
                  <FormLabel>Motivo (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ingresa el motivo de este ajuste"
                      className="resize-none"
                      {...field}
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
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
