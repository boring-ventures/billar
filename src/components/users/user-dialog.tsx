"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { User, UserRoleType } from "@/types/user";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useUsers } from "@/hooks/use-users";
import { Loader2 } from "lucide-react";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
  isSubmitting?: boolean;
}

const formSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  email: z.string().email("Formato de correo inválido").optional(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .optional(),
  role: z.enum(["SELLER", "ADMIN", "SUPERADMIN"] as const),
  companyId: z.string().optional(),
  active: z.boolean().default(true),
});

// Special value to represent no company selected
const NO_COMPANY = "none";

export function UserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  isSubmitting = false,
}: UserDialogProps) {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const { createUser, updateUser } = useUsers();
  const [loading, setLoading] = useState(false);

  const isEditing = !!user;

  // Get the user's role as a valid UserRoleType
  const getUserRole = (role: string | undefined): UserRoleType => {
    if (role === "SELLER" || role === "ADMIN" || role === "SUPERADMIN") {
      return role;
    }
    return "SELLER"; // Default role
  };

  // Helper to convert between form value and actual companyId
  const getCompanyIdValue = (id: string | null | undefined): string => {
    return id || NO_COMPANY;
  };

  const getActualCompanyId = (value: string): string | null => {
    return value === NO_COMPANY ? null : value;
  };

  // Define default values based on whether we're editing or creating
  const defaultValues = {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: "",
    password: "",
    role: getUserRole(user?.role as string),
    companyId: getCompanyIdValue(user?.companyId),
    active: user?.active !== undefined ? user.active : true,
  };

  const form = useForm<z.infer<typeof formSchema>>({
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

  // Reset form when user changes
  useEffect(() => {
    if (open) {
      // Different form schemas for create vs edit
      if (isEditing && user) {
        form.reset({
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          role: getUserRole(user?.role as string),
          companyId: getCompanyIdValue(user?.companyId),
          active: user?.active !== undefined ? user.active : true,
        });
      } else {
        form.reset({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "SELLER",
          companyId: NO_COMPANY,
          active: true,
        });
      }
    }
  }, [open, user, form, isEditing]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      let success;

      if (isEditing && user) {
        // Update existing user
        success = await updateUser(user.id, {
          firstName: values.firstName,
          lastName: values.lastName,
          role: values.role,
          active: values.active,
        });
      } else {
        // Create new user
        if (!values.email || !values.password) {
          toast({
            title: "Error",
            description:
              "El correo y la contraseña son obligatorios para nuevos usuarios",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        success = await createUser({
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          role: values.role,
          companyId: getActualCompanyId(values.companyId || NO_COMPANY),
          active: values.active,
        });
      }

      if (success) {
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los detalles del usuario a continuación."
              : "Completa los detalles para crear un nuevo usuario."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && user?.email && (
              <div className="space-y-2">
                <FormLabel>Correo</FormLabel>
                <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  {user.email}
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  El correo no se puede cambiar después de la creación.
                </p>
              </div>
            )}

            {!isEditing && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="juanperez@ejemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        El correo no se puede cambiar después de la creación.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SELLER">Vendedor</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="SUPERADMIN">
                        Super Administrador
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value || NO_COMPANY}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar una empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_COMPANY}>Ninguna</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isEditing && user?.companyId && (
              <div className="space-y-2">
                <FormLabel>Empresa</FormLabel>
                <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  {user.company?.name || "Empresa Asignada"}
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  La asignación de empresa no se puede cambiar después de la
                  creación.
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="leading-none">
                    <FormLabel>Activo</FormLabel>
                    <FormDescription>
                      Los usuarios inactivos no pueden iniciar sesión en el
                      sistema.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading || isSubmitting}>
                {loading || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Actualizando..." : "Creando..."}
                  </>
                ) : isEditing ? (
                  "Actualizar Usuario"
                ) : (
                  "Crear Usuario"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
