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
import { Label } from "@/components/ui/label";
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

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  companyId: z.string().min(1, "Company is required"),
  categoryId: z.string().optional(),
  sku: z.string().optional(),
  price: z.string().optional().default(""),
  criticalThreshold: z.coerce.number().min(0).default(5),
  stockAlerts: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface InventoryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
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
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    companyId || ""
  );

  const { createItem, updateItem } = useInventoryItems({
    companyId: selectedCompanyId || "",
  });
  const { data: categories = [] } = useInventoryCategoriesQuery({
    companyId: selectedCompanyId || "",
    enabled: !!selectedCompanyId,
  });

  const isEditMode = !!item;

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      companyId: companyId || "",
      categoryId: "none",
      sku: "",
      price: "",
      criticalThreshold: 5,
      stockAlerts: true,
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
          companyId: item.companyId,
          categoryId: item.categoryId || "none",
          sku: item.sku || "",
          price: item.price ? String(item.price) : "",
          criticalThreshold: item.criticalThreshold,
          stockAlerts: item.stockAlerts,
        });
        setSelectedCompanyId(item.companyId);
      } else {
        // Create mode - reset to defaults but keep companyId if provided
        form.reset({
          name: "",
          companyId: companyId || "",
          categoryId: "none",
          sku: "",
          price: "",
          criticalThreshold: 5,
          stockAlerts: true,
        });
        setSelectedCompanyId(companyId || "");
      }
    }
  }, [open, item, companyId, form]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // Convert price from string to number or null
      const price =
        data.price && data.price.trim() !== "" ? parseFloat(data.price) : null;

      if (isEditMode) {
        // Update existing item
        await updateItem.mutateAsync({
          id: item.id,
          name: data.name,
          categoryId: data.categoryId === "none" ? "" : data.categoryId,
          sku: data.sku,
          price,
          criticalThreshold: data.criticalThreshold,
          stockAlerts: data.stockAlerts,
        });
      } else {
        // Create new item
        await createItem.mutateAsync({
          name: data.name,
          companyId: data.companyId,
          categoryId: data.categoryId === "none" ? "" : data.categoryId,
          sku: data.sku,
          price,
          criticalThreshold: data.criticalThreshold,
          stockAlerts: data.stockAlerts,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            {!isEditMode && (
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select
                      onValueChange={(value) => handleCompanyChange(value)}
                      defaultValue={field.value}
                      value={field.value || ""}
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
                    <FormDescription>
                      The company this item belongs to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter item name"
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
