"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { TableStatus } from "@prisma/client";
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Table,
  useCreateTableMutation,
  useUpdateTableMutation,
} from "@/hooks/use-tables-query";

interface TableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table | null;
  onSuccess: () => void;
}

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

export function TableDialog({
  open,
  onOpenChange,
  table,
  onSuccess,
}: TableDialogProps) {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );

  const createTableMutation = useCreateTableMutation();
  const updateTableMutation = useUpdateTableMutation();

  const isEditing = !!table;

  // Define default values
  const defaultValues = {
    name: table?.name || "",
    companyId: table?.companyId || "",
    status: table?.status || "AVAILABLE",
    hourlyRate: table?.hourlyRate ? String(table.hourlyRate) : "",
  };

  const form = useForm<TableFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

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

  // Reset form when table changes
  useEffect(() => {
    if (open) {
      if (isEditing && table) {
        form.reset({
          name: table.name,
          companyId: table.companyId,
          status: table.status,
          hourlyRate: table.hourlyRate ? String(table.hourlyRate) : "",
        });
      } else {
        form.reset({
          name: "",
          companyId: "",
          status: "AVAILABLE",
          hourlyRate: "",
        });
      }
    }
  }, [open, table, form, isEditing]);

  const onSubmit = async (values: TableFormValues) => {
    try {
      if (isEditing && table) {
        // Update existing table
        await updateTableMutation.mutateAsync({
          tableId: table.id,
          tableData: values,
        });
      } else {
        // Create new table
        await createTableMutation.mutateAsync(values);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const isPending =
    createTableMutation.isPending || updateTableMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Table" : "Create New Table"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the table details below."
              : "Fill in the details to create a new table."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      {companies.map((company) => (
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Table" : "Create Table"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
