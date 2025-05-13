"use client";

import { useState, useEffect } from "react";
import { Table } from "@/hooks/use-tables-query";
import { useCreateTableSessionMutation } from "@/hooks/use-table-sessions-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { formatCurrency } from "@/lib/utils";
import { Clock, PlayCircle } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  tableId: z.string(),
  staffNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface QuickStartSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table | null;
  onSuccess?: () => void;
}

export function QuickStartSessionDialog({
  open,
  onOpenChange,
  table,
  onSuccess,
}: QuickStartSessionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const createSessionMutation = useCreateTableSessionMutation();
  const { profile } = useAuth();

  // Update current time every second
  useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  // Reset form values when table changes
  useEffect(() => {
    if (table && open) {
      form.reset({
        tableId: table.id,
        staffNotes: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tableId: table?.id || "",
      staffNotes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!table || !profile) return;

    setIsSubmitting(true);
    try {
      await createSessionMutation.mutateAsync({
        tableId: table.id,
        staffId: profile.id,
        staffNotes: values.staffNotes,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to start session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTableStyles = () => ({
    table: "bg-green-100 border-green-600",
    cloth: "bg-green-200",
  });

  const tableStyles = getTableStyles();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Quick Start Session
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {table && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-green-700">
                    {table.name}
                  </h3>
                  <div className="text-green-600 font-medium">
                    {formatCurrency(table.hourlyRate || 0)}/hour
                  </div>
                </div>

                <div className="flex justify-center my-4">
                  <div
                    className={`w-36 h-24 ${tableStyles.table} border-2 rounded-md flex items-center justify-center relative shadow-md`}
                  >
                    <div
                      className={`w-32 h-20 ${tableStyles.cloth} rounded-sm shadow-inner`}
                    ></div>

                    <div className="absolute w-3 h-3 rounded-full bg-black/70 -top-1 -left-1"></div>
                    <div className="absolute w-3 h-3 rounded-full bg-black/70 -top-1 -right-1"></div>
                    <div className="absolute w-3 h-3 rounded-full bg-black/70 bottom-[45%] -left-1.5"></div>
                    <div className="absolute w-3 h-3 rounded-full bg-black/70 bottom-[45%] -right-1.5"></div>
                    <div className="absolute w-3 h-3 rounded-full bg-black/70 -bottom-1 -left-1"></div>
                    <div className="absolute w-3 h-3 rounded-full bg-black/70 -bottom-1 -right-1"></div>

                    <div className="absolute w-1.5 h-1.5 rounded-full bg-white/70 bottom-[50%] left-[25%]"></div>
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-white/70 bottom-[50%] right-[25%]"></div>
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-white/70 bottom-[50%] left-[50%] transform -translate-x-1/2"></div>
                  </div>
                </div>

                <div className="flex items-center justify-center text-sm text-green-600 mb-2">
                  <Clock className="w-4 h-4 mr-1" />
                  {currentTime.toLocaleTimeString()}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="staffNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quick Note (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Any notes for this session?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="sm:w-1/2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white sm:w-1/2 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  "Starting..."
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    Start Now
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
