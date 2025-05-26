"use client";

import { useState, useEffect } from "react";
import { Table } from "@/hooks/use-tables-query";
import { useCreateTableSessionMutation } from "@/hooks/use-table-sessions-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { formatCurrency } from "@/lib/utils";
import { Clock, PlayCircle, Calendar } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  tableId: z.string(),
  staffNotes: z.string().optional(),
  customTime: z.string().optional(),
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
  const [showCustomTime, setShowCustomTime] = useState(false);
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

  // Reset form values when table changes or dialog opens
  useEffect(() => {
    if (table && open) {
      setShowCustomTime(false);
      form.reset({
        tableId: table.id,
        staffNotes: "",
        customTime: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tableId: table?.id || "",
      staffNotes: "",
      customTime: "",
    },
  });

  const handleStartNow = async () => {
    if (!table || !profile) return;

    const staffNotes = form.getValues("staffNotes");

    setIsSubmitting(true);
    try {
      await createSessionMutation.mutateAsync({
        tableId: table.id,
        staffId: profile.id,
        staffNotes,
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

  const handleStartWithCustomTime = async () => {
    if (!table || !profile) return;

    const values = form.getValues();

    if (!values.customTime) {
      form.setError("customTime", {
        type: "required",
        message: "Por favor selecciona una hora de inicio",
      });
      return;
    }

    // Create a date object with today's date and the selected time
    const today = new Date();
    const [hours, minutes] = values.customTime.split(":").map(Number);
    const customStartTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      hours,
      minutes
    );

    // Validate that the time is not in the future
    if (customStartTime > new Date()) {
      form.setError("customTime", {
        type: "validate",
        message: "La hora de inicio no puede ser en el futuro",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createSessionMutation.mutateAsync({
        tableId: table.id,
        staffId: profile.id,
        staffNotes: values.staffNotes,
        startedAt: customStartTime.toISOString(),
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

  // Get current time in HH:MM format for time input max value
  const getCurrentTimeString = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Inicio de Sesión
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-6">
            {table && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-green-700">
                    {table.name}
                  </h3>
                  <div className="text-green-600 font-medium">
                    {formatCurrency(table.hourlyRate || 0)}/hora
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
                  Hora actual: {currentTime.toLocaleTimeString()}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="staffNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota Rápida (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="¿Alguna nota para esta sesión?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-center">
                Selecciona una opción:
              </h4>

              {/* Start Now Option */}
              <Button
                type="button"
                onClick={handleStartNow}
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 h-12"
              >
                <PlayCircle className="h-5 w-5" />
                Iniciar Ahora
              </Button>

              {/* Start with Custom Time Option */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustomTime(!showCustomTime)}
                  className="w-full border-green-600 text-green-600 hover:bg-green-50 flex items-center justify-center gap-2 h-12"
                >
                  <Calendar className="h-5 w-5" />
                  Iniciar Sesión con Hora Específica
                </Button>

                {showCustomTime && (
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <FormField
                      control={form.control}
                      name="customTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de Inicio</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              max={getCurrentTimeString()}
                              {...field}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground mt-1">
                            Selecciona la hora en que realmente comenzó la
                            sesión
                          </p>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      onClick={handleStartWithCustomTime}
                      disabled={isSubmitting}
                      className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      {isSubmitting
                        ? "Iniciando..."
                        : "Iniciar con Hora Seleccionada"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Cancel Option */}
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
