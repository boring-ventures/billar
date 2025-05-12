"use client";

import { useEffect, useState } from "react";
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
import { useTables } from "@/hooks/use-tables";
import { TableStatus } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";

// Define the Table type based on the hook type
type Table = ReturnType<typeof useTables>["tables"][number];

interface TableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table | null;
  onSuccess: () => void;
  isSubmitting?: boolean;
}

const formSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  status: z.enum([TableStatus.AVAILABLE, TableStatus.OCCUPIED, TableStatus.RESERVED, TableStatus.MAINTENANCE]),
  hourlyRate: z.string().optional(),
});

export function TableDialog({
  open,
  onOpenChange,
  table,
  onSuccess,
  isSubmitting = false,
}: TableDialogProps) {
  const { toast } = useToast();
  const { createTable, updateTable } = useTables();
  const { profile } = useCurrentUser();
  const isEditing = !!table;

  // Define default values based on whether we're editing or creating
  const defaultValues = {
    name: table?.name || "",
    status: table?.status || TableStatus.AVAILABLE,
    hourlyRate: table?.hourlyRate?.toString() || "",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Reset form when table changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: table?.name || "",
        status: table?.status || TableStatus.AVAILABLE,
        hourlyRate: table?.hourlyRate?.toString() || "",
      });
    }
  }, [open, table, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let success;

      if (isEditing && table) {
        // Update existing table
        success = await updateTable(table.id, {
          name: values.name,
          status: values.status,
          hourlyRate: values.hourlyRate ? parseFloat(values.hourlyRate) : null,
        });
      } else {
        // Create new table
        success = await createTable({
          name: values.name,
          status: values.status,
          hourlyRate: values.hourlyRate ? parseFloat(values.hourlyRate) : null,
          companyId: profile?.companyId || "", // Use empty string as fallback for superadmin
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
                    <Input placeholder="Table 1" {...field} />
                  </FormControl>
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
                      <SelectItem value={TableStatus.AVAILABLE}>
                        Available
                      </SelectItem>
                      <SelectItem value={TableStatus.OCCUPIED}>
                        Occupied
                      </SelectItem>
                      <SelectItem value={TableStatus.RESERVED}>
                        Reserved
                      </SelectItem>
                      <SelectItem value={TableStatus.MAINTENANCE}>
                        Maintenance
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
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
                    ? "Update Table"
                    : "Create Table"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 