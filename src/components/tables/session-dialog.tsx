"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/providers/auth-provider";
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCreateTableSessionMutation } from "@/hooks/use-table-sessions-query";
import { Table } from "@/hooks/use-tables-query";
import { User } from "@/types/user";

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: Table | null; // Optional - if provided, pre-selects the table
  onSuccess: () => void;
}

const formSchema = z.object({
  tableId: z.string().min(1, "La mesa es obligatoria"),
  staffId: z.string().optional(),
});

type SessionFormValues = z.infer<typeof formSchema>;

export function SessionDialog({
  open,
  onOpenChange,
  table = null,
  onSuccess,
}: SessionDialogProps) {
  const { profile } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);

  const createSessionMutation = useCreateTableSessionMutation();

  // Define default values
  const defaultValues = {
    tableId: table?.id || "",
    staffId: profile?.id || "",
  };

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Fetch available tables for the dropdown
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch("/api/tables?status=AVAILABLE");
        if (response.ok) {
          const data = await response.json();
          setTables(data);
        }
      } catch (error) {
        console.error("Error fetching tables:", error);
      }
    };

    const fetchStaff = async () => {
      try {
        const response = await fetch("/api/users?role=SELLER");
        if (response.ok) {
          const data = await response.json();
          // Format staff names
          const formattedStaff = data.map((user: User) => ({
            id: user.id,
            name:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.id,
          }));
          setStaff(formattedStaff);
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
      }
    };

    if (open) {
      fetchTables();
      fetchStaff();
    }
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        tableId: table?.id || "",
        staffId: profile?.id || "",
      });
    }
  }, [open, table, form, profile]);

  const onSubmit = async (values: SessionFormValues) => {
    try {
      await createSessionMutation.mutateAsync({
        tableId: values.tableId,
        staffId: values.staffId || profile?.id || undefined,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Iniciar Nueva Sesión</DialogTitle>
          <DialogDescription>
            Inicia una nueva sesión para una mesa. Solo se pueden seleccionar
            mesas disponibles.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tableId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mesa</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!table} // Disable if table is pre-selected
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una mesa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tables.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} - {t.company?.name || "Empresa Desconocida"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    La mesa para la cual iniciar una sesión.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="staffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal (Opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Asignar personal (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Miembro del personal responsable de esta sesión.
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
              <Button type="submit" disabled={createSessionMutation.isPending}>
                {createSessionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Iniciar Sesión
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
