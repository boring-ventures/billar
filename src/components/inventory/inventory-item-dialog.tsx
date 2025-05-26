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
import { useInventoryCategoriesQuery } from "@/hooks/use-inventory-query";
import { useInventoryItems } from "@/hooks/use-inventory-items";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  companyId: z.string().min(1, "Company is required"),
  categoryId: z.string().optional(),
  sku: z.string().optional(),
  price: z.string().optional().default(""),
  criticalThreshold: z.coerce.number().min(0).default(5),
  stockAlerts: z.boolean().default(true),
  initialStock: z.coerce.number().min(0).default(0),
  initialCostPrice: z.string().optional().default(""),
  itemType: z.enum(["SALE", "INTERNAL_USE"]).default("SALE"),
});

type FormValues = z.infer<typeof formSchema>;

interface InventoryItem {
  id: string;
  companyId: string;
  categoryId: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  criticalThreshold: number;
  price: number | null;
  stockAlerts: boolean;
  itemType?: string;
}

interface InventoryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  companyId?: string;
  onSuccess?: () => void;
  defaultItemType?: string;
}

export function InventoryItemDialog({
  open,
  onOpenChange,
  item,
  companyId,
  onSuccess,
  defaultItemType,
}: InventoryItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const { profile } = useCurrentUser();
  const isSuperAdmin = profile?.role === "SUPERADMIN";

  // Use profile's company ID as default if not superadmin
  const defaultCompanyId = isSuperAdmin
    ? companyId || ""
    : profile?.companyId || companyId || "";

  const [selectedCompanyId, setSelectedCompanyId] =
    useState<string>(defaultCompanyId);

  const { createItem, updateItem } = useInventoryItems({
    companyId: selectedCompanyId || "",
  });
  const { data: categories = [] } = useInventoryCategoriesQuery({
    companyId: selectedCompanyId || "",
    enabled: !!selectedCompanyId,
  });

  const isEditMode = !!item;

  // Fetch companies for the dropdown (only needed for SUPERADMIN)
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!open || isEditMode || !isSuperAdmin) return;

      setIsLoadingCompanies(true);
      try {
        const response = await fetch("/api/companies");
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, [open, isEditMode, isSuperAdmin]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      companyId: defaultCompanyId,
      categoryId: "none",
      sku: "",
      price: "",
      criticalThreshold: 5,
      stockAlerts: true,
      initialStock: 0,
      initialCostPrice: "",
      itemType: (defaultItemType as "SALE" | "INTERNAL_USE") || "SALE",
    },
  });

  // Handle company selection change
  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    form.setValue("companyId", value);
    // Reset category selection when company changes
    form.setValue("categoryId", "none");
  };

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      if (item) {
        // Edit mode - populate form with item data
        form.reset({
          name: item.name,
          companyId: isSuperAdmin
            ? item.companyId
            : profile?.companyId || item.companyId,
          categoryId: item.categoryId || "none",
          sku: item.sku || "",
          price: item.price ? String(item.price) : "",
          criticalThreshold: item.criticalThreshold,
          stockAlerts: item.stockAlerts,
          initialStock: 0,
          initialCostPrice: "",
          itemType: (item.itemType as "SALE" | "INTERNAL_USE") || "SALE",
        });
        setSelectedCompanyId(
          isSuperAdmin ? item.companyId : profile?.companyId || item.companyId
        );
      } else {
        // Create mode - reset to defaults but keep companyId if provided
        form.reset({
          name: "",
          companyId: defaultCompanyId,
          categoryId: "none",
          sku: "",
          price: "",
          criticalThreshold: 5,
          stockAlerts: true,
          initialStock: 0,
          initialCostPrice: "",
          itemType: (defaultItemType as "SALE" | "INTERNAL_USE") || "SALE",
        });
        setSelectedCompanyId(defaultCompanyId);
      }
    }
  }, [
    open,
    item,
    companyId,
    form,
    profile,
    isSuperAdmin,
    defaultCompanyId,
    defaultItemType,
  ]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // Convert price from string to number or null
      const price =
        data.price && data.price.trim() !== "" ? parseFloat(data.price) : null;

      // If not superadmin, always use the profile's company ID
      const submitCompanyId = isSuperAdmin
        ? data.companyId
        : profile?.companyId || data.companyId;

      // Validate companyId
      if (!submitCompanyId) {
        throw new Error(
          "Company ID is required. Please select a company or check your profile settings."
        );
      }

      // Handle categoryId properly - send null or empty string instead of "none"
      const categoryId = data.categoryId === "none" ? "" : data.categoryId;

      if (isEditMode) {
        // Update existing item
        await updateItem.mutateAsync({
          id: item.id,
          name: data.name,
          categoryId,
          sku: data.sku || "",
          price: price !== null ? price : undefined,
          criticalThreshold: data.criticalThreshold,
          stockAlerts: data.stockAlerts,
          itemType: data.itemType,
        });
      } else {
        // Convert initial cost price from string to number or undefined
        const initialCostPrice =
          data.initialCostPrice && data.initialCostPrice.trim() !== ""
            ? parseFloat(data.initialCostPrice)
            : undefined;

        // Create new item
        console.log("Submitting new item:", {
          name: data.name,
          companyId: submitCompanyId,
          categoryId,
          sku: data.sku || "",
          price: price !== null ? price : undefined,
          criticalThreshold: data.criticalThreshold,
          stockAlerts: data.stockAlerts,
          quantity: data.initialStock,
          initialCostPrice,
          itemType: data.itemType,
        });

        await createItem.mutateAsync({
          name: data.name,
          companyId: submitCompanyId,
          categoryId,
          sku: data.sku || "",
          price: price !== null ? price : undefined,
          criticalThreshold: data.criticalThreshold,
          stockAlerts: data.stockAlerts,
          quantity: data.initialStock,
          initialCostPrice,
          createInitialMovement: true,
          itemType: data.itemType,
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error saving item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show dialog when not loading companies in create mode
  const shouldShowDialog = open && (isEditMode || !isLoadingCompanies);

  return (
    <Dialog open={shouldShowDialog} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Artículo" : "Añadir Nuevo Artículo"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Modifica los detalles del artículo de inventario."
              : "Ingresa los detalles del nuevo artículo de inventario."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ingresa el nombre del artículo"
                      {...field}
                    />
                  </FormControl>
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
                      value={field.value}
                      onValueChange={handleCompanyChange}
                      disabled={isEditMode || isLoadingCompanies}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value || "none"}
                    disabled={!selectedCompanyId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            selectedCompanyId
                              ? "Selecciona una categoría"
                              : "Selecciona una empresa primero"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ingresa el SKU"
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ingresa el precio"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="criticalThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Umbral Crítico</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="5"
                        {...field}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormDescription>
                      Alerta cuando el stock esté en o por debajo de este nivel
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stockAlerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Habilitar Alertas de Stock</FormLabel>
                      <FormDescription>
                        Mostrar alertas para niveles bajos de stock
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {!isEditMode && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="initialStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Inicial</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          {...field}
                          value={field.value || 0}
                        />
                      </FormControl>
                      <FormDescription>
                        Establece la cantidad inicial de stock (se registrará
                        como un movimiento)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="initialCostPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio de Costo Inicial</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        Precio de costo por unidad para el stock inicial
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="itemType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Artículo</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || "SALE"}
                      disabled={!selectedCompanyId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              selectedCompanyId
                                ? "Selecciona un tipo de artículo"
                                : "Selecciona una empresa primero"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SALE">Venta</SelectItem>
                        <SelectItem value="INTERNAL_USE">
                          Uso Interno
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting
                  ? isEditMode
                    ? "Guardando..."
                    : "Creando..."
                  : isEditMode
                    ? "Guardar Cambios"
                    : "Crear Artículo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
