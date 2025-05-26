"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  useCreateExpense,
  useUpdateExpense,
  Expense,
} from "@/hooks/use-expenses";

const EXPENSE_CATEGORIES = [
  { value: "STAFF", label: "Personal" },
  { value: "UTILITIES", label: "Servicios" },
  { value: "MAINTENANCE", label: "Mantenimiento" },
  { value: "SUPPLIES", label: "Suministros" },
  { value: "RENT", label: "Alquiler" },
  { value: "INSURANCE", label: "Seguros" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OTHER", label: "Otros" },
];

const expenseSchema = z.object({
  category: z.string().min(1, "La categoría es requerida"),
  description: z.string().min(1, "La descripción es requerida"),
  amount: z
    .string()
    .min(1, "El monto es requerido")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "El monto debe ser un número mayor a 0"),
  expenseDate: z.string().min(1, "La fecha es requerida"),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  expense?: Expense | null;
  companyId?: string;
}

export function ExpenseDialog({
  open,
  onClose,
  expense,
  companyId,
}: ExpenseDialogProps) {
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "STAFF",
      description: "",
      amount: "",
      expenseDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  // Reset form when dialog opens/closes or expense changes
  useEffect(() => {
    if (open) {
      if (expense) {
        // Editing existing expense
        form.reset({
          category: expense.category,
          description: expense.description,
          amount: expense.amount.toString(),
          expenseDate: new Date(expense.expenseDate)
            .toISOString()
            .split("T")[0],
          notes: expense.notes || "",
        });
      } else {
        // Creating new expense
        form.reset({
          category: "STAFF",
          description: "",
          amount: "",
          expenseDate: new Date().toISOString().split("T")[0],
          notes: "",
        });
      }
    }
  }, [open, expense, form]);

  const handleSubmit = async (data: ExpenseFormData) => {
    try {
      const expenseData = {
        companyId,
        category: data.category,
        description: data.description,
        amount: parseFloat(data.amount),
        expenseDate: new Date(data.expenseDate).toISOString(),
        notes: data.notes || undefined,
      };

      console.log("Form data:", data);
      console.log("Expense data to send:", expenseData);

      if (expense) {
        // Update existing expense
        await updateExpense.mutateAsync({
          id: expense.id,
          ...expenseData,
        });
      } else {
        // Create new expense
        await createExpense.mutateAsync(expenseData);
      }

      onClose();
    } catch (error) {
      // Error handling is done in the hooks
      console.error("Error saving expense:", error);
    }
  };

  const isLoading = createExpense.isPending || updateExpense.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {expense ? "Editar Gasto" : "Agregar Nuevo Gasto"}
          </DialogTitle>
          <DialogDescription>
            {expense
              ? "Modifica los detalles del gasto."
              : "Completa la información del nuevo gasto."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input placeholder="Descripción del gasto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto (Bs)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha del Gasto</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales sobre el gasto"
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
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {expense ? "Actualizando..." : "Creando..."}
                  </>
                ) : expense ? (
                  "Actualizar"
                ) : (
                  "Crear"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
