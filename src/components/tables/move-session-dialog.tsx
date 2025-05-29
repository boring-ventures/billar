"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Loader2, ArrowRight } from "lucide-react";
import { useMoveTableSessionMutation } from "@/hooks/use-table-sessions-query";
import { useTablesQuery, Table } from "@/hooks/use-tables-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface MoveSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId?: string;
  currentTableName?: string;
  currentTableId?: string;
  onSuccess: () => void;
}

const formSchema = z.object({
  targetTableId: z.string().min(1, "Debe seleccionar una mesa destino"),
});

type FormValues = z.infer<typeof formSchema>;

export function MoveSessionDialog({
  open,
  onOpenChange,
  sessionId,
  currentTableName,
  currentTableId,
  onSuccess,
}: MoveSessionDialogProps) {
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const moveSessionMutation = useMoveTableSessionMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetTableId: "",
    },
  });

  // Fetch available tables (excluding the current table)
  const { data: allTables = [] } = useTablesQuery({
    status: "AVAILABLE",
  });

  useEffect(() => {
    if (allTables.length > 0 && currentTableId) {
      // Filter out the current table from available tables
      const filtered = allTables.filter(
        (table: Table) => table.id !== currentTableId
      );
      setAvailableTables(filtered);
    }
  }, [allTables, currentTableId]);

  const onSubmit = async (values: FormValues) => {
    if (!sessionId) return;

    try {
      await moveSessionMutation.mutateAsync({
        sessionId,
        targetTableId: values.targetTableId,
      });
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch {
      // Error handling is done in the mutation
    }
  };

  const selectedTable = availableTables.find(
    (table) => table.id === form.watch("targetTableId")
  );

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mover Sesión a Otra Mesa</DialogTitle>
          <DialogDescription>
            Selecciona la mesa destino para mover esta sesión activa. Todos los
            artículos rastreados se moverán junto con la sesión.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Current table info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Mesa Actual
                    </p>
                    <p className="text-lg font-semibold text-blue-700">
                      {currentTableName}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="targetTableId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mesa Destino</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una mesa disponible" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableTables.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No hay mesas disponibles
                        </div>
                      ) : (
                        availableTables.map((table) => (
                          <SelectItem key={table.id} value={table.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{table.name}</span>
                              {table.hourlyRate && (
                                <span className="text-xs text-muted-foreground">
                                  ${table.hourlyRate}/hora
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Solo se muestran las mesas que están disponibles y sin
                    sesiones activas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show selected table info */}
            {selectedTable && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Mesa Destino Seleccionada
                    </p>
                    <p className="text-lg font-semibold text-green-700">
                      {selectedTable.name}
                    </p>
                    {selectedTable.hourlyRate && (
                      <p className="text-sm text-green-600">
                        Tarifa: ${selectedTable.hourlyRate}/hora
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Alert>
              <AlertDescription>
                <strong>Importante:</strong> Al mover la sesión, todos los
                artículos rastreados se mantendrán intactos y el tiempo de
                sesión continuará corriendo normalmente en la nueva mesa.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={moveSessionMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  moveSessionMutation.isPending ||
                  !form.watch("targetTableId") ||
                  availableTables.length === 0
                }
              >
                {moveSessionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Mover Sesión
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
