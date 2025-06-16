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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building2,
  MapPin,
  Phone,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  Save,
  Loader2,
} from "lucide-react";
import { UserRole } from "@prisma/client";
import {
  parseOperatingDays,
  stringifyOperatingDays,
  createDefaultIndividualHours,
  parseIndividualDayHours,
  stringifyIndividualDayHours,
} from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const companyFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

const businessHoursFormSchema = z.object({
  businessHoursStart: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)")
    .optional(),
  businessHoursEnd: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)")
    .optional(),
  timezone: z.string().optional(),
  operatingDays: z
    .array(z.string())
    .min(1, "Selecciona al menos un día")
    .optional(),
});

// Schema for individual day hours
const individualDaySchema = z.object({
  start: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)"),
  end: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)"),
  enabled: z.boolean(),
});

const individualBusinessHoursFormSchema = z.object({
  MON: individualDaySchema,
  TUE: individualDaySchema,
  WED: individualDaySchema,
  THU: individualDaySchema,
  FRI: individualDaySchema,
  SAT: individualDaySchema,
  SUN: individualDaySchema,
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;
type BusinessHoursFormValues = z.infer<typeof businessHoursFormSchema>;
type IndividualBusinessHoursFormValues = z.infer<
  typeof individualBusinessHoursFormSchema
>;

interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  businessHoursStart?: string;
  businessHoursEnd?: string;
  timezone?: string;
  operatingDays?: string;
  individualDayHours?: string;
  useIndividualHours?: boolean;
  createdAt: string;
  _count?: {
    profiles: number;
    tables: number;
    inventoryItems: number;
  };
}

const DAYS_OF_WEEK = [
  { value: "MON", label: "Lunes" },
  { value: "TUE", label: "Martes" },
  { value: "WED", label: "Miércoles" },
  { value: "THU", label: "Jueves" },
  { value: "FRI", label: "Viernes" },
  { value: "SAT", label: "Sábado" },
  { value: "SUN", label: "Domingo" },
];

export function CompanySection() {
  const { profile } = useCurrentUser();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingBusinessHours, setIsSubmittingBusinessHours] =
    useState(false);
  const [useIndividualHours, setUseIndividualHours] = useState(
    company?.useIndividualHours || false
  );

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
    },
  });

  const businessHoursForm = useForm<BusinessHoursFormValues>({
    resolver: zodResolver(businessHoursFormSchema),
    defaultValues: {
      businessHoursStart: "",
      businessHoursEnd: "",
      timezone: "America/La_Paz",
      operatingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    },
  });

  const individualHoursForm = useForm<IndividualBusinessHoursFormValues>({
    resolver: zodResolver(individualBusinessHoursFormSchema),
    defaultValues: createDefaultIndividualHours(),
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

          // Parse operating days from JSON
          const operatingDays = parseOperatingDays(data.operatingDays);

          businessHoursForm.reset({
            businessHoursStart: data.businessHoursStart || "",
            businessHoursEnd: data.businessHoursEnd || "",
            timezone: data.timezone || "America/La_Paz",
            operatingDays: operatingDays,
          });

          // Initialize individual hours form
          const individualHours =
            parseIndividualDayHours(data.individualDayHours) ||
            createDefaultIndividualHours(
              data.businessHoursStart,
              data.businessHoursEnd,
              operatingDays
            );

          // Convert to the form's expected type structure
          const formData: IndividualBusinessHoursFormValues = {
            MON: individualHours.MON || {
              start: "08:00",
              end: "18:00",
              enabled: true,
            },
            TUE: individualHours.TUE || {
              start: "08:00",
              end: "18:00",
              enabled: true,
            },
            WED: individualHours.WED || {
              start: "08:00",
              end: "18:00",
              enabled: true,
            },
            THU: individualHours.THU || {
              start: "08:00",
              end: "18:00",
              enabled: true,
            },
            FRI: individualHours.FRI || {
              start: "08:00",
              end: "18:00",
              enabled: true,
            },
            SAT: individualHours.SAT || {
              start: "08:00",
              end: "18:00",
              enabled: true,
            },
            SUN: individualHours.SUN || {
              start: "08:00",
              end: "18:00",
              enabled: true,
            },
          };

          individualHoursForm.reset(formData);
          setUseIndividualHours(data.useIndividualHours || false);
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
  }, [profile?.companyId, form, businessHoursForm, individualHoursForm, toast]);

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

  const onSubmitBusinessHours = async (data: BusinessHoursFormValues) => {
    if (!profile?.companyId || profile.role === UserRole.SELLER) {
      toast({
        title: "Error",
        description:
          "No tienes permisos para editar los horarios de la empresa",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingBusinessHours(true);
    try {
      const response = await fetch(`/api/companies/${profile.companyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessHoursStart: data.businessHoursStart,
          businessHoursEnd: data.businessHoursEnd,
          timezone: data.timezone || "America/La_Paz",
          operatingDays: stringifyOperatingDays(data.operatingDays || []),
          useIndividualHours: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar los horarios");
      }

      toast({
        title: "Éxito",
        description: "Horarios de negocio actualizados correctamente",
      });

      // Refresh company data
      const updatedCompany = await response.json();
      setCompany(updatedCompany);
    } catch (error) {
      console.error("Error updating business hours:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los horarios",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingBusinessHours(false);
    }
  };

  const onSubmitIndividualHours = async (
    data: IndividualBusinessHoursFormValues
  ) => {
    if (!profile?.companyId || profile.role === UserRole.SELLER) {
      toast({
        title: "Error",
        description:
          "No tienes permisos para editar los horarios de la empresa",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingBusinessHours(true);
    try {
      // Debug log the data being sent
      console.log("Individual hours data being sent:", data);
      const stringifiedData = stringifyIndividualDayHours(data);
      console.log("Stringified individual hours:", stringifiedData);

      const requestBody = {
        individualDayHours: stringifiedData,
        useIndividualHours: true,
      };
      console.log("Request body:", requestBody);

      const response = await fetch(`/api/companies/${profile.companyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.log("Response status:", response.status);
        console.log("Response statusText:", response.statusText);
        console.log(
          "Response headers:",
          Array.from(response.headers.entries())
        );

        let errorData;
        try {
          const responseText = await response.text();
          console.log("Raw response text:", responseText);

          if (responseText.trim()) {
            errorData = JSON.parse(responseText);
          } else {
            errorData = { error: "Empty response from server" };
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorData = { error: "Invalid response format from server" };
        }

        console.error("API Error:", errorData);
        throw new Error(
          errorData.error || "Error al actualizar los horarios individuales"
        );
      }

      toast({
        title: "Éxito",
        description: "Horarios individuales actualizados correctamente",
      });

      // Refresh company data
      const updatedCompany = await response.json();
      setCompany(updatedCompany);
    } catch (error) {
      console.error("Error updating individual hours:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudieron actualizar los horarios individuales",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingBusinessHours(false);
    }
  };

  const handleModeToggle = async (useIndividual: boolean) => {
    try {
      setUseIndividualHours(useIndividual);

      if (useIndividual) {
        // Switching to individual mode - create default individual hours from general hours
        const generalValues = businessHoursForm.getValues();
        console.log(
          "General values when switching to individual:",
          generalValues
        );

        const defaultIndividualHours = createDefaultIndividualHours(
          generalValues.businessHoursStart || undefined,
          generalValues.businessHoursEnd || undefined,
          generalValues.operatingDays
        );
        console.log(
          "Created default individual hours:",
          defaultIndividualHours
        );

        // Convert to the form's expected type structure
        const formData: IndividualBusinessHoursFormValues = {
          MON: defaultIndividualHours.MON || {
            start: "08:00",
            end: "18:00",
            enabled: true,
          },
          TUE: defaultIndividualHours.TUE || {
            start: "08:00",
            end: "18:00",
            enabled: true,
          },
          WED: defaultIndividualHours.WED || {
            start: "08:00",
            end: "18:00",
            enabled: true,
          },
          THU: defaultIndividualHours.THU || {
            start: "08:00",
            end: "18:00",
            enabled: true,
          },
          FRI: defaultIndividualHours.FRI || {
            start: "08:00",
            end: "18:00",
            enabled: true,
          },
          SAT: defaultIndividualHours.SAT || {
            start: "08:00",
            end: "18:00",
            enabled: true,
          },
          SUN: defaultIndividualHours.SUN || {
            start: "08:00",
            end: "18:00",
            enabled: true,
          },
        };

        individualHoursForm.reset(formData);
        await onSubmitIndividualHours(formData);
      } else {
        // Switching to general mode
        const generalValues = businessHoursForm.getValues();
        console.log("General values when switching to general:", generalValues);
        await onSubmitBusinessHours(generalValues);
      }
    } catch (error) {
      console.error("Error in handleModeToggle:", error);
      // Revert the toggle state if there was an error
      setUseIndividualHours(!useIndividual);
      toast({
        title: "Error",
        description: "No se pudo cambiar el modo de horarios",
        variant: "destructive",
      });
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

            {/* Business Hours Display */}
            {(company.businessHoursStart || company.businessHoursEnd) && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Horarios de Negocio</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {company.businessHoursStart && company.businessHoursEnd ? (
                    <>
                      {company.businessHoursStart} - {company.businessHoursEnd}
                      {company.operatingDays && (
                        <span className="ml-2">
                          (
                          {parseOperatingDays(company.operatingDays).length ===
                          7
                            ? "Todos los días"
                            : `${parseOperatingDays(company.operatingDays).length} días por semana`}
                          )
                        </span>
                      )}
                    </>
                  ) : (
                    "No configurados"
                  )}
                </div>
              </div>
            )}
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

      {/* Business Hours Form */}
      {canEdit && company && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios de Negocio
            </CardTitle>
            <CardDescription>
              Configura los horarios de operación para mejorar el cálculo de
              ventas diarias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  ¿Por qué configurar horarios de negocio?
                </p>
                <p>
                  Los horarios configurados se usarán para calcular las
                  &quot;ventas de hoy&quot; basándose en tu día laboral real, no
                  en el día calendario (00:00-23:59).
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="hours-mode">Horarios individuales por día</Label>
              <Switch
                id="hours-mode"
                checked={useIndividualHours}
                onCheckedChange={handleModeToggle}
                disabled={isSubmittingBusinessHours}
              />
            </div>

            {!useIndividualHours ? (
              // General Hours Mode
              <Form {...businessHoursForm}>
                <form
                  onSubmit={businessHoursForm.handleSubmit(
                    onSubmitBusinessHours
                  )}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={businessHoursForm.control}
                      name="businessHoursStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de Apertura</FormLabel>
                          <FormControl>
                            <Input type="time" placeholder="08:00" {...field} />
                          </FormControl>
                          <FormDescription>
                            Hora en que abre el negocio (formato 24h)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={businessHoursForm.control}
                      name="businessHoursEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de Cierre</FormLabel>
                          <FormControl>
                            <Input type="time" placeholder="22:00" {...field} />
                          </FormControl>
                          <FormDescription>
                            Hora en que cierra el negocio (formato 24h)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={businessHoursForm.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zona Horaria</FormLabel>
                        <FormControl>
                          <Input placeholder="America/La_Paz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessHoursForm.control}
                    name="operatingDays"
                    render={() => (
                      <FormItem>
                        <FormLabel>Días de Operación</FormLabel>
                        <div className="grid grid-cols-7 gap-2">
                          {DAYS_OF_WEEK.map((day) => (
                            <FormField
                              key={day.value}
                              control={businessHoursForm.control}
                              name="operatingDays"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={day.value}
                                    className="flex flex-col items-center space-y-2"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(
                                          day.value
                                        )}
                                        onCheckedChange={(checked) => {
                                          const currentDays = field.value || [];
                                          return checked
                                            ? field.onChange([
                                                ...currentDays,
                                                day.value,
                                              ])
                                            : field.onChange(
                                                currentDays.filter(
                                                  (value) => value !== day.value
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-xs font-normal">
                                      {day.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormDescription>
                          Los horarios de trabajo afectan los cálculos de
                          &quot;Ventas de Hoy&quot; en el dashboard. Si no se
                          configuran, se usará el día calendario completo (00:00
                          - 23:59).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmittingBusinessHours}>
                    {isSubmittingBusinessHours ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Horarios Generales
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              // Individual Hours Mode
              <Form {...individualHoursForm}>
                <form
                  onSubmit={individualHoursForm.handleSubmit(
                    onSubmitIndividualHours
                  )}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            {day.label}
                          </Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const sourceDayData =
                                  individualHoursForm.getValues(
                                    day.value as keyof IndividualBusinessHoursFormValues
                                  );
                                const allDays = [
                                  "MON",
                                  "TUE",
                                  "WED",
                                  "THU",
                                  "FRI",
                                  "SAT",
                                  "SUN",
                                ];

                                allDays.forEach((targetDay) => {
                                  if (targetDay !== day.value) {
                                    individualHoursForm.setValue(
                                      targetDay as keyof IndividualBusinessHoursFormValues,
                                      {
                                        ...sourceDayData,
                                      }
                                    );
                                  }
                                });
                              }}
                              className="text-xs"
                            >
                              Aplicar a todos
                            </Button>
                            <FormField
                              control={individualHoursForm.control}
                              name={
                                `${day.value}.enabled` as `${keyof IndividualBusinessHoursFormValues}.enabled`
                              }
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value as boolean}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pl-4">
                          <FormField
                            control={individualHoursForm.control}
                            name={
                              `${day.value}.start` as `${keyof IndividualBusinessHoursFormValues}.start`
                            }
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Apertura
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="time"
                                    {...field}
                                    disabled={
                                      !individualHoursForm.watch(
                                        `${day.value}.enabled` as `${keyof IndividualBusinessHoursFormValues}.enabled`
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={individualHoursForm.control}
                            name={
                              `${day.value}.end` as `${keyof IndividualBusinessHoursFormValues}.end`
                            }
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Cierre
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="time"
                                    {...field}
                                    disabled={
                                      !individualHoursForm.watch(
                                        `${day.value}.enabled` as `${keyof IndividualBusinessHoursFormValues}.enabled`
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {day.value !== "SUN" && <Separator className="my-2" />}
                      </div>
                    ))}
                  </div>

                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Configura horarios específicos para cada día. Las
                      &quot;Ventas de Hoy&quot; se calcularán según el día
                      actual del negocio.
                    </p>
                  </div>

                  <Button type="submit" disabled={isSubmittingBusinessHours}>
                    {isSubmittingBusinessHours ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Horarios Individuales
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Business Hours Display */}
      {company && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Horarios Actuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {company.useIndividualHours ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Horarios individuales por día:
                </p>
                <div className="grid gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const dayData = parseIndividualDayHours(
                      company.individualDayHours
                    )?.[day.value];
                    return (
                      <div
                        key={day.value}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="font-medium">{day.label}:</span>
                        <span>
                          {dayData?.enabled
                            ? `${dayData.start} - ${dayData.end}`
                            : "Cerrado"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Horario general:</span>
                  <span>
                    {company.businessHoursStart && company.businessHoursEnd
                      ? `${company.businessHoursStart} - ${company.businessHoursEnd}`
                      : "No configurado"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Días de operación:</span>
                  <span>
                    {company.operatingDays
                      ? parseOperatingDays(company.operatingDays)
                          .map(
                            (day) =>
                              DAYS_OF_WEEK.find((d) => d.value === day)?.label
                          )
                          .join(", ")
                      : "Todos los días"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Zona horaria:</span>
                  <span>{company.timezone || "America/La_Paz"}</span>
                </div>
              </div>
            )}
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
