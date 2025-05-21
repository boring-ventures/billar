"use client";

import { useEffect, useState, useRef } from "react";
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
import { Loader2, RefreshCw, Download, Eye, EyeOff } from "lucide-react";
import html2canvas from "html2canvas";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";

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

// Function to generate a random password
const generateRandomPassword = () => {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one of each character type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  password += "0123456789"[Math.floor(Math.random() * 10)];
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)];

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
};

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
  const [showPassword, setShowPassword] = useState(false);
  const userCardRef = useRef<HTMLDivElement>(null);
  const { profile: currentUserProfile } = useCurrentUser();

  const isEditing = !!user;
  const isSuperAdmin = currentUserProfile?.role === "SUPERADMIN";

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

  // Generate random password
  const handleGeneratePassword = () => {
    const password = generateRandomPassword();
    form.setValue("password", password);
  };

  // Save user card as image
  const handleSaveAsImage = async () => {
    if (!userCardRef.current) return;

    try {
      const canvas = await html2canvas(userCardRef.current);
      const image = canvas.toDataURL("image/png");

      // Create a download link
      const downloadLink = document.createElement("a");
      const userName =
        `${form.getValues("firstName")}_${form.getValues("lastName")}`.toLowerCase();
      downloadLink.href = image;
      downloadLink.download = `user_${userName}.png`;
      downloadLink.click();

      toast({
        title: "Éxito",
        description: "Detalles del usuario guardados como imagen",
      });
    } catch (error) {
      console.error("Error saving image:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la imagen",
        variant: "destructive",
      });
    }
  };

  // Fetch companies - for superadmin fetch all, for others fetch just their company
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

    // Fetch companies if the form is open (needed for both superadmin and regular admin)
    if (open) {
      fetchCompanies();
    }
  }, [open]);

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
        // For creating new users
        const defaultCompanyId =
          // If not superadmin, use current user's company
          !isSuperAdmin && currentUserProfile?.companyId
            ? currentUserProfile.companyId
            : NO_COMPANY;

        form.reset({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          // Non-superadmins cannot create superadmins
          role: "SELLER",
          companyId: defaultCompanyId,
          active: true,
        });
      }

      // Reset password visibility
      setShowPassword(false);
    }
  }, [open, user, form, isEditing, isSuperAdmin, currentUserProfile]);

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
                      <div className="flex space-x-2">
                        <div className="relative flex-grow">
                          <FormControl>
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="********"
                              {...field}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </Button>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={handleGeneratePassword}
                          title="Generar contraseña"
                        >
                          <RefreshCw size={16} />
                        </Button>
                      </div>
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
                      {isSuperAdmin && (
                        <SelectItem value="SUPERADMIN">
                          Super Administrador
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && isSuperAdmin && (
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

            {!isEditing && !isSuperAdmin && currentUserProfile?.companyId && (
              <div className="space-y-2">
                <FormLabel>Empresa</FormLabel>
                <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  {companies.find((c) => c.id === currentUserProfile.companyId)
                    ?.name || "Cargando empresa..."}
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  Los usuarios creados estarán asociados a tu empresa.
                </p>
              </div>
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

            {!isEditing &&
              !loading &&
              form.getValues("firstName") &&
              form.getValues("lastName") && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium">
                      Vista previa del usuario
                    </h3>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleSaveAsImage}
                      className="h-8"
                    >
                      <Download size={16} className="mr-1" />
                      Guardar
                    </Button>
                  </div>
                  <div
                    ref={userCardRef}
                    className="border rounded-md p-4 bg-card text-card-foreground"
                  >
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg flex justify-between">
                        {form.getValues("firstName")}{" "}
                        {form.getValues("lastName")}
                        <Badge
                          variant={
                            form.getValues("role") === "SUPERADMIN"
                              ? "destructive"
                              : form.getValues("role") === "ADMIN"
                                ? "default"
                                : "outline"
                          }
                        >
                          {form.getValues("role") === "SUPERADMIN"
                            ? "Super Admin"
                            : form.getValues("role") === "ADMIN"
                              ? "Admin"
                              : "Vendedor"}
                        </Badge>
                      </h3>
                      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-sm">
                        <span className="font-medium">Email:</span>
                        <span>{form.getValues("email")}</span>
                        <span className="font-medium">Contraseña:</span>
                        <span>{form.getValues("password")}</span>
                        <span className="font-medium">Empresa:</span>
                        <span>
                          {form.getValues("companyId") === NO_COMPANY
                            ? "Ninguna"
                            : companies.find(
                                (c) => c.id === form.getValues("companyId")
                              )?.name ||
                              (!isSuperAdmin && currentUserProfile?.companyId
                                ? "Tu Empresa"
                                : "N/A")}
                        </span>
                        <span className="font-medium">Estado:</span>
                        <span>
                          {form.getValues("active") ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground bg-muted p-2 rounded-sm">
                        El usuario podrá iniciar sesión inmediatamente con estas
                        credenciales.
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
