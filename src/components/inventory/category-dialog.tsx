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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCategory,
  useUpdateCategory,
  InventoryCategory,
} from "@/hooks/use-inventory";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: InventoryCategory | null;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
}: CategoryDialogProps) {
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        description: category.description || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
      });
    }
  }, [category, form]);

  const onSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      if (category) {
        await updateCategoryMutation.mutateAsync({
          id: category.id,
          data,
        });
      } else {
        await createCategoryMutation.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : "Create Category"}
          </DialogTitle>
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
                    <Input placeholder="Category name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Category description (optional)"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  createCategoryMutation.isPending ||
                  updateCategoryMutation.isPending
                }
              >
                {category ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
