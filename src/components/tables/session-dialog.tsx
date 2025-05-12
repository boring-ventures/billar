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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCreateTableSessionMutation } from "@/hooks/use-table-sessions-query";
import { Table } from "@/hooks/use-tables-query";

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: Table | null; // Optional - if provided, pre-selects the table
  onSuccess: () => void;
}

const formSchema = z.object({
  tableId: z.string().min(1, "Table is required"),
  staffId: z.string().optional(),
});

type SessionFormValues = z.infer<typeof formSchema>;

export function SessionDialog({
  open,
  onOpenChange,
  table = null,
  onSuccess,
}: SessionDialogProps) {
  const { toast } = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);

  const createSessionMutation = useCreateTableSessionMutation();

  // Define default values
  const defaultValues = {
    tableId: table?.id || "",
    staffId: "",
  };

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Fetch available tables for the dropdown
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch("/api/tables?status=AVAILABLE");
        if (response.ok) {
          const data = await response.json();
          setTables(data);
        }
      } catch (error) {
        console.error("Error fetching tables:", error);
      }
    };

    const fetchStaff = async () => {
      try {
        const response = await fetch("/api/users?role=SELLER");
        if (response.ok) {
          const data = await response.json();
          // Format staff names
          const formattedStaff = data.map((user: any) => ({
            id: user.id,
            name:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.id,
          }));
          setStaff(formattedStaff);
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
      }
    };

    if (open) {
      fetchTables();
      fetchStaff();
    }
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        tableId: table?.id || "",
        staffId: "",
      });
    }
  }, [open, table, form]);

  const onSubmit = async (values: SessionFormValues) => {
    try {
      await createSessionMutation.mutateAsync({
        tableId: values.tableId,
        staffId: values.staffId || undefined,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start New Session</DialogTitle>
          <DialogDescription>
            Start a new session for a table. Only available tables can be
            selected.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tableId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!table} // Disable if table is pre-selected
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a table" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tables.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} - {t.company?.name || "Unknown Company"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The table to start a session for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="staffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign staff (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Staff member responsible for this session.
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
              <Button type="submit" disabled={createSessionMutation.isPending}>
                {createSessionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Start Session
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
