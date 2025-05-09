"use client";

import { useState } from "react";
import { TableStatus } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUpdateTableStatus, tableStatusSchema } from "@/hooks/use-tables";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { TABLE_STATUS_LABELS } from "@/types/table";

// Use the schema from hooks for consistency
type FormValues = z.infer<typeof tableStatusSchema>;

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
  const { currentUser, profile } = useCurrentUser();
  const { updateTableStatus, isSubmitting } = useUpdateTableStatus();

  // Use either profile or currentUser for compatibility
  const userRole = currentUser?.role || profile?.role;

  // Based on user role, determine which status changes are allowed
  const allowedStatuses = (): TableStatus[] => {
    if (userRole === "SELLER") {
      // Sellers can only change between AVAILABLE and OCCUPIED
      if (currentStatus === "AVAILABLE") return ["AVAILABLE", "OCCUPIED"];
      if (currentStatus === "OCCUPIED") return ["AVAILABLE", "OCCUPIED"];
      return [currentStatus]; // No change allowed for other statuses
    }
    // ADMIN and SUPERADMIN can change to any status
    return ["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"];
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(tableStatusSchema),
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
      const success = await updateTableStatus(
        tableId,
        values.status,
        values.notes
      );
      if (success) {
        if (onStatusChange) {
          onStatusChange();
        }
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error updating table status:", error);
    }
  };

  const permittedStatuses = allowedStatuses();
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
                disabled={!canChangeStatus || isSubmitting}
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
                {canChangeStatus
                  ? "Change the operational status of this table"
                  : "You don't have permission to change this status"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {canChangeStatus && (
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
        )}

        {canChangeStatus && (
          <Button
            type="submit"
            disabled={isSubmitting || form.getValues().status === currentStatus}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        )}
      </form>
    </Form>
  );
}
