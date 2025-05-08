"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TableStatus } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTables } from "@/hooks/use-tables";
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

const formSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"]),
  hourlyRate: z.coerce
    .number()
    .min(0, "Hourly rate must be a positive number")
    .optional(),
  companyId: z.string().uuid().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TableFormProps {
  initialData?: Table;
  isEditMode?: boolean;
}

export function TableForm({ initialData, isEditMode = false }: TableFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createTable, updateTable } = useTables();
  const { currentUser, profile } = useCurrentUser();
  
  // Use either profile or currentUser for compatibility
  const userRole = currentUser?.role || profile?.role;
  const userCompanyId = currentUser?.companyId || profile?.companyId;

  const defaultValues: Partial<FormValues> = {
    name: initialData?.name || "",
    status: initialData?.status || "AVAILABLE",
    hourlyRate: initialData?.hourlyRate || undefined,
    companyId: undefined, // Will be set automatically
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Set companyId when form is submitted
  useEffect(() => {
    if (userCompanyId) {
      form.setValue("companyId", userCompanyId);
    }
  }, [userCompanyId, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    // For superadmins without a company selected, show error
    if (!values.companyId && userRole === "SUPERADMIN") {
      toast({
        title: "Company Required",
        description: "Please select a company before creating a table.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditMode && initialData) {
        const success = await updateTable(initialData.id, values);
        if (success) {
          router.push(`/tables/${initialData.id}`);
        }
      } else {
        const success = await createTable(values);
        if (success) {
          router.push("/tables");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <FormLabel>Hourly Rate</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  {...field}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? undefined : e.target.value;
                    field.onChange(value);
                  }}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Set the hourly rate for renting this table (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Update Table" : "Create Table"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
