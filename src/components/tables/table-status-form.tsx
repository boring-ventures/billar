"use client";

import { useState } from "react";
import { TableStatus } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUpdateTableStatus, tableStatusUpdateSchema } from "@/hooks/use-tables";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { TABLE_STATUS_LABELS } from "@/types/table";

// Use the schema from hooks for consistency
type FormValues = z.infer<typeof tableStatusUpdateSchema>;

interface TableStatusFormProps {
  tableId: string;
  currentStatus: TableStatus;
  onStatusChange?: () => void;
  onSuccess?: () => void;
}

export function TableStatusForm({
  tableId,
  currentStatus,
  onStatusChange,
  onSuccess,
}: TableStatusFormProps) {
  const updateStatusMutation = useUpdateTableStatus();

  // All users are superadmins and can change to any status
  const allowedStatuses = ["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"] as TableStatus[];

  const form = useForm<FormValues>({
    resolver: zodResolver(tableStatusUpdateSchema),
    defaultValues: {
      status: currentStatus,
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (values.status === currentStatus) {
      return; // No change, don't submit
    }

    try {
      await updateStatusMutation.mutateAsync({
        tableId,
        data: values
      });
      
      if (onStatusChange) {
        onStatusChange();
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating table status:", error);
    }
  };

  const permittedStatuses = allowedStatuses;
  const canChangeStatus = permittedStatuses.length > 1;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Change Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!canChangeStatus || updateStatusMutation.isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {permittedStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {TABLE_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Change the operational status of this table
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add notes about this status change"
                  className="h-20 resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Add any relevant notes about why the status is changing
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={updateStatusMutation.isPending || form.getValues().status === currentStatus}
          className="w-full"
        >
          {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Status
        </Button>
      </form>
    </Form>
  );
}
