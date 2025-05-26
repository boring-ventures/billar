"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Users, Calendar } from "lucide-react";
import { UserRole } from "@prisma/client";

const companyFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  createdAt: string;
  _count?: {
    profiles: number;
    tables: number;
    inventoryItems: number;
  };
}

export function CompanySection() {
  const { profile } = useCurrentUser();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
    },
  });

  // Fetch company data
  useEffect(() => {
    const fetchCompany = async () => {
      if (!profile?.companyId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/companies/${profile.companyId}`);
        if (response.ok) {
          const data = await response.json();
          setCompany(data);
          form.reset({
            name: data.name || "",
            address: data.address || "",
            phone: data.phone || "",
          });
        }
      } catch (error) {
        console.error("Error fetching company:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información de la empresa",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [profile?.companyId, form, toast]);

  const onSubmit = async (data: CompanyFormValues) => {
    if (!profile?.companyId || profile.role === UserRole.SELLER) {
      toast({
        title: "Error",
        description:
          "No tienes permisos para editar la información de la empresa",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/companies/${profile.companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la empresa");
      }

      const updatedCompany = await response.json();
      setCompany(updatedCompany);

      toast({
        title: "Empresa actualizada",
        description:
          "La información de la empresa ha sido actualizada correctamente.",
      });
    } catch (error) {
      console.error("Error updating company:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar la empresa",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Información de la Empresa</CardTitle>
          <CardDescription>Cargando información...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile?.companyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Información de la Empresa</CardTitle>
          <CardDescription>
            No estás asociado a ninguna empresa actualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Contacta a un administrador para ser asignado a una empresa.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canEdit =
    profile.role === UserRole.ADMIN || profile.role === UserRole.SUPERADMIN;

  return (
    <div className="space-y-6">
      {/* Company Overview */}
      {company && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {company.name}
            </CardTitle>
            <CardDescription>Información general de la empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {company.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Dirección</p>
                    <p className="text-sm text-muted-foreground">
                      {company.address}
                    </p>
                  </div>
                </div>
              )}

              {company.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">
                      {company.phone}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Creada</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(company.createdAt).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>

              {company._count && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Empleados</p>
                    <p className="text-sm text-muted-foreground">
                      {company._count.profiles} usuarios
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Edit Form */}
      {canEdit && company && (
        <Card>
          <CardHeader>
            <CardTitle>Editar Información</CardTitle>
            <CardDescription>
              Actualiza la información de la empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Dirección de la empresa"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="Número de teléfono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Role Badge */}
      <Card>
        <CardHeader>
          <CardTitle>Tu Rol en la Empresa</CardTitle>
          <CardDescription>
            Información sobre tus permisos y responsabilidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Rol actual:</p>
              <Badge variant="outline" className="mt-1">
                {profile.role === UserRole.SELLER && "Vendedor"}
                {profile.role === UserRole.ADMIN && "Administrador"}
                {profile.role === UserRole.SUPERADMIN && "Super Administrador"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {profile.role === UserRole.SELLER &&
                "Acceso a gestión de mesas, inventario y ventas"}
              {profile.role === UserRole.ADMIN &&
                "Acceso completo a la gestión de la empresa"}
              {profile.role === UserRole.SUPERADMIN &&
                "Acceso total al sistema"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
