"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { TableStatus } from "@prisma/client";
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
  FormDescription,
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Table,
  useCreateTableMutation,
  useUpdateTableMutation,
} from "@/hooks/use-tables-query";

interface TableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table | null;
  onSuccess: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "El nombre de la mesa es obligatorio"),
  companyId: z.string().min(1, "La empresa es obligatoria"),
  status: z.nativeEnum(TableStatus),
  hourlyRate: z
    .union([
      z
        .string()
        .min(0)
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
          message: "La tarifa por hora debe ser un número positivo",
        }),
      z.literal(""),
    ])
    .transform((val) => (val === "" ? null : val)),
});

type TableFormValues = z.infer<typeof formSchema>;

export function TableDialog({
  open,
  onOpenChange,
  table,
  onSuccess,
}: TableDialogProps) {
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );

  const createTableMutation = useCreateTableMutation();
  const updateTableMutation = useUpdateTableMutation();

  const isEditing = !!table;

  // Define default values
  const defaultValues = {
    name: table?.name || "",
    companyId: table?.companyId || "",
    status: table?.status || "AVAILABLE",
    hourlyRate: table?.hourlyRate ? String(table.hourlyRate) : "",
  };

  const form = useForm<TableFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Fetch companies for the dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch("/api/companies");
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    fetchCompanies();
  }, []);

  // Reset form when table changes
  useEffect(() => {
    if (open) {
      if (isEditing && table) {
        form.reset({
          name: table.name,
          companyId: table.companyId,
          status: table.status,
          hourlyRate: table.hourlyRate ? String(table.hourlyRate) : "",
        });
      } else {
        form.reset({
          name: "",
          companyId: "",
          status: "AVAILABLE",
          hourlyRate: "",
        });
      }
    }
  }, [open, table, form, isEditing]);

  const onSubmit = async (values: TableFormValues) => {
    try {
      if (isEditing && table) {
        // Update existing table
        await updateTableMutation.mutateAsync({
          tableId: table.id,
          tableData: values,
        });
      } else {
        // Create new table
        await createTableMutation.mutateAsync(values);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const isPending =
    createTableMutation.isPending || updateTableMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Mesa" : "Crear Nueva Mesa"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los detalles de la mesa a continuación."
              : "Completa los detalles para crear una nueva mesa."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Mesa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingresa nombre de mesa" {...field} />
                  </FormControl>
                  <FormDescription>
                    El nombre o número que identifica esta mesa.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una empresa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    La empresa a la que pertenece esta mesa.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Disponible</SelectItem>
                      <SelectItem value="OCCUPIED">Ocupada</SelectItem>
                      <SelectItem value="RESERVED">Reservada</SelectItem>
                      <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    El estado actual de esta mesa.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarifa por Hora</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ingresa tarifa por hora (opcional)"
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>
                    La tarifa por hora para esta mesa (dejar vacío si no
                    aplica).
                  </FormDescription>
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
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Actualizar Mesa" : "Crear Mesa"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
