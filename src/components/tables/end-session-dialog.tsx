"use client";

import { useState, useEffect } from "react";
import {
  useEndTableSessionMutation,
  TableSession,
} from "@/hooks/use-table-sessions-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Clock, StopCircle, Calendar } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  customEndTime: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EndSessionDialogProps {
  sessionId: string;
  sessionStartTime: Date;
  children?: React.ReactNode;
  onSessionEnded?: (endedSession: TableSession) => void;
}

export function EndSessionDialog({
  sessionId,
  sessionStartTime,
  children,
  onSessionEnded,
}: EndSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCustomTime, setShowCustomTime] = useState(false);
  const endSessionMutation = useEndTableSessionMutation({ skipRedirect: true });

  // Update current time every second
  useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  // Reset form values when dialog opens
  useEffect(() => {
    if (open) {
      setShowCustomTime(false);
      form.reset({
        customEndTime: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customEndTime: "",
    },
  });

  const handleEndNow = async () => {
    setIsSubmitting(true);
    try {
      const result = await endSessionMutation.mutateAsync({ sessionId });
      setOpen(false);
      // Call the callback if provided
      if (onSessionEnded) {
        onSessionEnded(result);
      }
    } catch (error) {
      console.error("Failed to end session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndWithCustomTime = async () => {
    const values = form.getValues();

    if (!values.customEndTime) {
      form.setError("customEndTime", {
        type: "required",
        message: "Por favor selecciona una hora de finalización",
      });
      return;
    }

    // Create a date object with today's date and the selected time
    const today = new Date();
    const [hours, minutes] = values.customEndTime.split(":").map(Number);
    const customEndTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      hours,
      minutes
    );

    // Validate that the time is not before session start time
    if (customEndTime < sessionStartTime) {
      form.setError("customEndTime", {
        type: "validate",
        message:
          "La hora de finalización no puede ser antes del inicio de la sesión",
      });
      return;
    }

    // Validate that the time is not in the future
    if (customEndTime > new Date()) {
      form.setError("customEndTime", {
        type: "validate",
        message: "La hora de finalización no puede ser en el futuro",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await endSessionMutation.mutateAsync({
        sessionId,
        endedAt: customEndTime.toISOString(),
      });
      setOpen(false);
      // Call the callback if provided
      if (onSessionEnded) {
        onSessionEnded(result);
      }
    } catch (error) {
      console.error("Failed to end session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current time in HH:MM format for time input max value
  const getCurrentTimeString = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  };

  // Get session start time in HH:MM format for time input min value
  const getStartTimeString = () => {
    return `${sessionStartTime.getHours().toString().padStart(2, "0")}:${sessionStartTime.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="destructive">
            <StopCircle className="mr-2 h-4 w-4" />
            Finalizar Sesión
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Finalizar Sesión
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-amber-700">
                  Sesión Activa
                </h3>
                <div className="text-amber-600 text-sm mt-1">
                  Iniciada: {sessionStartTime.toLocaleString()}
                </div>
                <div className="flex items-center justify-center text-sm text-amber-600 mt-2">
                  <Clock className="w-4 h-4 mr-1" />
                  Hora actual: {currentTime.toLocaleTimeString()}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-center">
                Selecciona una opción:
              </h4>

              {/* End Now Option */}
              <Button
                type="button"
                onClick={handleEndNow}
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 h-12"
              >
                <StopCircle className="h-5 w-5" />
                Finalizar Ahora
              </Button>

              {/* End with Custom Time Option */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustomTime(!showCustomTime)}
                  className="w-full border-red-600 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 h-12"
                >
                  <Calendar className="h-5 w-5" />
                  Finalizar con Hora Específica
                </Button>

                {showCustomTime && (
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <FormField
                      control={form.control}
                      name="customEndTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de Finalización</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              min={getStartTimeString()}
                              max={getCurrentTimeString()}
                              {...field}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground mt-1">
                            Selecciona la hora en que realmente finalizó la
                            sesión
                          </p>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      onClick={handleEndWithCustomTime}
                      disabled={isSubmitting}
                      className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      {isSubmitting
                        ? "Finalizando..."
                        : "Finalizar con Hora Seleccionada"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Cancel Option */}
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
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
