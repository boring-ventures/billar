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
}

interface InventoryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  companyId?: string;
  onSuccess?: () => void;
}

export function InventoryItemDialog({
  open,
  onOpenChange,
  item,
  companyId,
  onSuccess,
}: InventoryItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const { profile, isLoading: isLoadingProfile } = useCurrentUser();
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
        });
        setSelectedCompanyId(defaultCompanyId);
      }
    }
  }, [open, item, companyId, form, profile, isSuperAdmin, defaultCompanyId]);

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
        });
      } else {
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
          createInitialMovement: true,
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
          <DialogTitle>{isEditMode ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Make changes to the inventory item below."
              : "Enter the details for the new inventory item."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} />
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
                    <FormLabel>Company</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={handleCompanyChange}
                      disabled={isEditMode || isLoadingCompanies}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a company" />
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
                  <FormLabel>Category</FormLabel>
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
                              ? "Select a category"
                              : "Select a company first"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Uncategorized</SelectItem>
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
                    <FormLabel>SKU (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter SKU"
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
                    <FormLabel>Price (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter price"
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
                    <FormLabel>Critical Threshold</FormLabel>
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
                      Alert when stock is at or below this level
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
                      <FormLabel>Enable Stock Alerts</FormLabel>
                      <FormDescription>
                        Show alerts for low stock levels
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {!isEditMode && (
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="initialStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Stock</FormLabel>
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
                        Set the initial stock quantity (will be recorded as a
                        movement)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
