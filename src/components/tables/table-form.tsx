"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { TableStatus } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  useCreateTableMutation,
  useUpdateTableMutation,
  Table,
} from "@/hooks/use-tables-query";
import { useQuery } from "@tanstack/react-query";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  companyId: z.string().min(1, "Company is required"),
  status: z.nativeEnum(TableStatus),
  hourlyRate: z
    .union([
      z
        .string()
        .min(0)
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
          message: "Hourly rate must be a positive number",
        }),
      z.literal(""),
    ])
    .transform((val) => (val === "" ? null : val)),
});

type TableFormValues = z.infer<typeof formSchema>;

interface TableFormProps {
  initialData?: Table;
}

export function TableForm({ initialData }: TableFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!initialData;

  const createTableMutation = useCreateTableMutation();
  const updateTableMutation = useUpdateTableMutation();

  // Fetch companies for dropdown
  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await fetch("/api/companies");
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      return response.json();
    },
  });

  // Initialize form with default values or initial data
  const form = useForm<TableFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      companyId: initialData?.companyId || "",
      status: initialData?.status || "AVAILABLE",
      hourlyRate: initialData?.hourlyRate ? String(initialData.hourlyRate) : "",
    },
  });

  const onSubmit = async (data: TableFormValues) => {
    try {
      if (isEditing) {
        await updateTableMutation.mutateAsync({
          tableId: initialData.id,
          tableData: data,
        });

        toast({
          title: "Success",
          description: "Table updated successfully",
        });

        router.push(`/tables/${initialData.id}`);
      } else {
        const result = await createTableMutation.mutateAsync(data);

        toast({
          title: "Success",
          description: "Table created successfully",
        });

        router.push(`/tables/${result.id}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter table name" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name or number that identifies this table.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      {companies.map((company: any) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The company this table belongs to.
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
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
                    The current status of this table.
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
                      placeholder="Enter hourly rate (optional)"
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>
                    The hourly rate for this table (leave empty if not
                    applicable).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createTableMutation.isPending || updateTableMutation.isPending
                }
              >
                {isEditing ? "Update Table" : "Create Table"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
