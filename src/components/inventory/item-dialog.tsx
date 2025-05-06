"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInventory } from "@/hooks/use-inventory";

const itemFormSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  categoryId: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.coerce
    .number()
    .int()
    .min(0, "Quantity must be a positive number"),
  criticalThreshold: z.coerce
    .number()
    .int()
    .min(0, "Threshold must be a positive number"),
  price: z.coerce.number().min(0, "Price must be a positive number").optional(),
  stockAlerts: z.boolean().default(true),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
}

export function ItemDialog({ open, onOpenChange, item }: ItemDialogProps) {
  const { createItem, updateItem, categories, fetchCategories } =
    useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open, fetchCategories]);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      categoryId: "",
      sku: "",
      quantity: 0,
      criticalThreshold: 5,
      price: undefined,
      stockAlerts: true,
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        categoryId: item.categoryId || "",
        sku: item.sku || "",
        quantity: item.quantity,
        criticalThreshold: item.criticalThreshold,
        price: item.price,
        stockAlerts: item.stockAlerts,
      });
    } else {
      form.reset({
        name: "",
        categoryId: "",
        sku: "",
        quantity: 0,
        criticalThreshold: 5,
        price: undefined,
        stockAlerts: true,
      });
    }
  }, [item, form]);

  const onSubmit = async (data: ItemFormValues) => {
    setIsSubmitting(true);
    try {
      if (item) {
        await updateItem(item.id, data);
      } else {
        await createItem(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Create Item"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Item name" {...field} />
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
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {categories?.map((category) => (
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

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Item SKU (optional)"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Current quantity"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber || 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="criticalThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Critical Threshold</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Low stock threshold"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber || 0);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Alert when stock falls below this level
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Item price (optional)"
                      {...field}
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) => {
                        field.onChange(e.target.valueAsNumber || undefined);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stockAlerts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enable Stock Alerts</FormLabel>
                    <FormDescription>
                      Show alerts when stock falls below the critical threshold
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {item ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
