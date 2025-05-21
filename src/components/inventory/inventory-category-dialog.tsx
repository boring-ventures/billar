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
import { Textarea } from "@/components/ui/textarea";
import { useInventoryCategories } from "@/hooks/use-inventory-categories";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  companyId: z.string().min(1, "Company is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
}

interface InventoryCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: InventoryCategory | null;
  companyId?: string;
  onSuccess?: () => void;
}

export function InventoryCategoryDialog({
  open,
  onOpenChange,
  category,
  companyId,
  onSuccess,
}: InventoryCategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const { profile } = useCurrentUser();
  const isSuperAdmin = profile?.role === "SUPERADMIN";

  // Use profile's company ID as default if not superadmin
  const defaultCompanyId = isSuperAdmin
    ? companyId || ""
    : profile?.companyId || companyId || "";

  const { createCategory, updateCategory } = useInventoryCategories();
  const { toast } = useToast();

  const isEditMode = !!category;

  // Fetch companies for the dropdown (only needed for SUPERADMIN)
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isSuperAdmin) return;

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
  }, [isSuperAdmin]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      companyId: defaultCompanyId,
    },
  });

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (open) {
      if (category) {
        // Edit mode - populate form with category data
        form.reset({
          name: category.name,
          description: category.description || "",
          companyId: isSuperAdmin
            ? category.companyId
            : profile?.companyId || category.companyId,
        });
      } else {
        // Create mode - reset to defaults but keep companyId if provided
        form.reset({
          name: "",
          description: "",
          companyId: defaultCompanyId,
        });
      }
    }
  }, [
    open,
    category,
    companyId,
    form,
    profile,
    isSuperAdmin,
    defaultCompanyId,
  ]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // If not superadmin, always use the profile's company ID
      const submitCompanyId = isSuperAdmin
        ? data.companyId
        : profile?.companyId || data.companyId;

      if (isEditMode) {
        // Update existing category
        await updateCategory.mutateAsync({
          id: category.id,
          name: data.name,
          description: data.description,
        });
      } else {
        // Create new category
        await createCategory.mutateAsync({
          name: data.name,
          description: data.description,
          companyId: submitCompanyId,
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while saving the category",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Category" : "Add New Category"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Make changes to the inventory category below."
              : "Enter the details for the new inventory category."}
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
                    <Input placeholder="Enter category name" {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter category description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Only show company selection for superadmins and in create mode */}
            {!isEditMode && isSuperAdmin && (
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
                      The company this category belongs to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
