"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCompanies } from "@/hooks/use-companies";

// Define the Company type based on the hook type
type Company = ReturnType<typeof useCompanies>["companies"][number];

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onSuccess: () => void;
  isSubmitting?: boolean;
}

// Special values for nullable fields
const EMPTY_VALUE = "none";

const formSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  address: z.string(),
  phone: z.string(),
});

// Helper to convert between form value and actual field value
const getFormValue = (value: string | null | undefined): string => {
  return value || EMPTY_VALUE;
};

const getActualValue = (value: string): string | null => {
  return value === EMPTY_VALUE ? null : value;
};

export function CompanyDialog({
  open,
  onOpenChange,
  company,
  onSuccess,
  isSubmitting = false,
}: CompanyDialogProps) {
  const { toast } = useToast();
  const { createCompany, updateCompany } = useCompanies();
  const isEditing = !!company;

  // Define default values based on whether we're editing or creating
  const defaultValues = {
    name: company?.name || "",
    address: getFormValue(company?.address),
    phone: getFormValue(company?.phone),
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Reset form when company changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: company?.name || "",
        address: getFormValue(company?.address),
        phone: getFormValue(company?.phone),
      });
    }
  }, [open, company, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let success;

      if (isEditing && company) {
        // Update existing company
        success = await updateCompany(company.id, {
          name: values.name,
          address: getActualValue(values.address),
          phone: getActualValue(values.phone),
        });
      } else {
        // Create new company
        success = await createCompany({
          name: values.name,
          address: getActualValue(values.address),
          phone: getActualValue(values.phone),
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
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Company" : "Create New Company"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the company details below."
              : "Fill in the details to create a new company."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="ACME Corporation" {...field} />
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
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123 Main St, City, Country"
                      {...field}
                      value={field.value === EMPTY_VALUE ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value || EMPTY_VALUE);
                      }}
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+1 234 567 8900"
                      {...field}
                      value={field.value === EMPTY_VALUE ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value || EMPTY_VALUE);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                    ? "Update Company"
                    : "Create Company"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
