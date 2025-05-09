"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useCreateTable, 
  useUpdateTable, 
  tableFormSchema,
  type TableFormValues 
} from "@/hooks/use-tables";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
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
import { Table } from "@/types/table";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Use the schema and types from our hooks
type FormValues = z.infer<typeof tableFormSchema>;

interface TableFormProps {
  initialData?: Table;
  isEditMode?: boolean;
}

export function TableForm({ initialData, isEditMode = false }: TableFormProps) {
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Use the dedicated hooks for table operations
  const createMutation = useCreateTable();
  const updateMutation = isEditMode && initialData?.id ? useUpdateTable(initialData.id) : null;
  
  // Determine if the form is submitting
  const isSubmitting = createMutation.isPending || updateMutation?.isPending;
  
  // Get user data
  const { currentUser, profile } = useCurrentUser();
  // Safe default values in case properties are undefined
  const userRole = currentUser?.role || profile?.role || "SUPERADMIN"; // Ensure a default role
  const userCompanyId = currentUser?.companyId || profile?.companyId;

  // Setup form with default values
  const defaultValues: Partial<FormValues> = {
    name: initialData?.name || "",
    status: initialData?.status || "AVAILABLE",
    hourlyRate: initialData?.hourlyRate || undefined,
    companyId: initialData?.companyId || undefined,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues,
  });

  // Set companyId when profile/user data loads
  useEffect(() => {
    if (userCompanyId) {
      form.setValue("companyId", userCompanyId);
    }
  }, [userCompanyId, form]);
  
  // Handle navigation after successful submission
  useEffect(() => {
    if (submitSuccess) {
      const redirectUrl = isEditMode && initialData?.id 
        ? `/tables/${initialData.id}` 
        : "/tables";
      
      // Use direct URL navigation to avoid React Router issues
      window.location.href = redirectUrl;
    }
  }, [submitSuccess, isEditMode, initialData?.id]);

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    // For superadmins without a company selected, show error
    if (!values.companyId && userRole === "SUPERADMIN") {
      toast({
        title: "Company Required",
        description: "Please select a company before creating a table.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditMode && initialData?.id && updateMutation) {
        // Update existing table
        await updateMutation.mutateAsync(values);
        toast({ title: "Success", description: "Table updated successfully" });
      } else {
        // Create new table
        await createMutation.mutateAsync(values);
        toast({ title: "Success", description: "Table created successfully" });
      }
      
      // Mark submission as successful to trigger navigation
      setSubmitSuccess(true);
    } catch (error) {
      console.error("Error with table operation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Don't allow further interaction if the submission was successful
  if (submitSuccess) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-4">Redirecting...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Table Name</FormLabel>
              <FormControl>
                <Input placeholder="Table 1" {...field} />
              </FormControl>
              <FormDescription>
                Enter a unique name for the billiard table.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select table status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="OCCUPIED">Occupied</SelectItem>
                  <SelectItem value="RESERVED">Reserved</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Set the current operational status of the table.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hourlyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  value={field.value === undefined || field.value === null ? "" : String(field.value)}
                  onChange={(e) => {
                    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Set the hourly rate for this table, or leave blank for variable pricing.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Update Table" : "Create Table"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
