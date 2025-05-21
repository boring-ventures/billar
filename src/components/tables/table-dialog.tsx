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
    .string()
    .min(1, "La tarifa por hora es obligatoria")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "La tarifa por hora debe ser un número positivo",
    }),
});

type TableFormValues = z.infer<typeof formSchema>;

// Add a hook to fetch current user profile
const useCurrentUserProfile = () => {
  const [profile, setProfile] = useState<{
    id: string;
    role: string;
    companyId: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, isLoading };
};

export function TableDialog({
  open,
  onOpenChange,
  table,
  onSuccess,
}: TableDialogProps) {
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const { profile, isLoading: isLoadingProfile } = useCurrentUserProfile();

  const createTableMutation = useCreateTableMutation();
  const updateTableMutation = useUpdateTableMutation();

  const isEditing = !!table;
  const isSuperAdmin = profile?.role === "SUPERADMIN";

  // Define default values based on user role
  const defaultValues = {
    name: table?.name || "",
    companyId: table?.companyId || profile?.companyId || "",
    status: table?.status || "AVAILABLE",
    hourlyRate: table?.hourlyRate ? String(table.hourlyRate) : "",
  };

  const form = useForm<TableFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Fetch companies for the dropdown (only needed for SUPERADMIN)
  useEffect(() => {
    if (isSuperAdmin) {
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
    }
  }, [isSuperAdmin]);

  // Reset form when table or profile changes
  useEffect(() => {
    if (open && profile) {
      if (isEditing && table) {
        form.reset({
          name: table.name,
          companyId: isSuperAdmin ? table.companyId : profile.companyId || "",
          status: table.status,
          hourlyRate: table.hourlyRate ? String(table.hourlyRate) : "",
        });
      } else {
        form.reset({
          name: "",
          companyId: isSuperAdmin ? "" : profile.companyId || "",
          status: "AVAILABLE",
          hourlyRate: "",
        });
      }
    }
  }, [open, table, form, isEditing, profile, isSuperAdmin]);

  const onSubmit = async (values: TableFormValues) => {
    try {
      // If not superadmin, ensure we use the user's company ID
      const submitValues = {
        ...values,
        companyId: isSuperAdmin
          ? values.companyId
          : profile?.companyId || values.companyId,
      };

      if (isEditing && table) {
        // Update existing table
        await updateTableMutation.mutateAsync({
          tableId: table.id,
          tableData: submitValues,
        });
      } else {
        // Create new table
        await createTableMutation.mutateAsync(submitValues);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const isPending =
    createTableMutation.isPending ||
    updateTableMutation.isPending ||
    isLoadingProfile;

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

            {/* Only show company selection for superadmins */}
            {isSuperAdmin && (
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
            )}

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
                      placeholder="Ingresa tarifa por hora"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>
                    La tarifa por hora para esta mesa.
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
