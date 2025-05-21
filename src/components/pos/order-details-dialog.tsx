"use client";

import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePosOrders } from "@/hooks/use-pos-orders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { User, FileDown } from "lucide-react";
import { generateOrderPDF } from "@/lib/pdf-utils";

interface OrderDetailsDialogProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({
  orderId,
  open,
  onOpenChange,
}: OrderDetailsDialogProps) {
  const { useOrder, updateOrder, getPaymentMethodText, getPaymentStatusText } =
    usePosOrders({
      companyId: "",
    });

  const { data: order, isLoading } = useOrder(orderId);
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdatePayment = async () => {
    if (!order || (!paymentMethod && !paymentStatus)) return;

    setIsUpdating(true);
    try {
      await updateOrder.mutateAsync({
        id: order.id,
        paymentMethod:
          (paymentMethod as "CASH" | "QR" | "CREDIT_CARD") || undefined,
        paymentStatus: (paymentStatus as "PAID" | "UNPAID") || undefined,
      });

      toast({
        title: "Éxito",
        description: "Pago de orden actualizado exitosamente",
      });
    } catch (error) {
      console.error("Failed to update payment:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to export order to PDF
  const handleExportToPDF = () => {
    if (!order) return;

    try {
      // Generate PDF document
      const doc = generateOrderPDF(order);

      // Save the PDF file with a name based on the order ID
      doc.save(`orden-${order.id.substring(0, 8)}.pdf`);

      toast({
        title: "Éxito",
        description: "Orden exportada a PDF exitosamente",
      });
    } catch (error) {
      console.error("Error exporting order to PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar la orden a PDF",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Cargando Detalles de Orden...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  // Format staff name for display
  const staffName = order.staff
    ? `${order.staff.firstName || ""} ${order.staff.lastName || ""}`.trim() ||
      "Usuario"
    : "No registrado";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Detalles de la Orden</DialogTitle>
          <DialogDescription>
            Orden #{order.id.substring(0, 8)} creada el{" "}
            {format(new Date(order.createdAt), "MMM dd, yyyy 'at' h:mm a")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Estado de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={
                    order.paymentStatus === "PAID" ? "default" : "outline"
                  }
                >
                  {getPaymentStatusText(order.paymentStatus)}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>{getPaymentMethodText(order.paymentMethod)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mesa</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  {order.tableSession ? (
                    <div className="space-y-1">
                      <div>{order.tableSession.table.name}</div>
                      {order.tableSession.totalCost && (
                        <div className="text-sm text-muted-foreground">
                          Costo de Sesión: Bs.
                          {Number(order.tableSession.totalCost).toFixed(2)}
                        </div>
                      )}
                    </div>
                  ) : (
                    "Sin mesa asignada"
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Monto Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  Bs. {Number(order.amount).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff Information Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Ejecutado por
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{staffName}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Ítems de la Orden</CardTitle>
              <CardDescription>
                {order.orderItems.length} ítems en esta orden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ítem</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">
                      Precio Unitario
                    </TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.orderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.item?.name || "Ítem Desconocido"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        Bs. {Number(item.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        Bs.{" "}
                        {(Number(item.unitPrice) * item.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>Total</div>
              <div className="font-bold">
                Bs. {Number(order.amount).toFixed(2)}
              </div>
            </CardFooter>
          </Card>

          {/* Update Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Actualizar Pago</CardTitle>
              <CardDescription>
                Actualizar método de pago o estado para esta orden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Método de Pago</label>
                  <Select
                    defaultValue={order.paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Efectivo</SelectItem>
                      <SelectItem value="QR">Pago QR</SelectItem>
                      <SelectItem value="CREDIT_CARD">
                        Tarjeta de Crédito
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado de Pago</label>
                  <Select
                    defaultValue={order.paymentStatus}
                    onValueChange={setPaymentStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAID">Pagado</SelectItem>
                      <SelectItem value="UNPAID">Pendiente de Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleUpdatePayment}
                disabled={isUpdating || (!paymentMethod && !paymentStatus)}
              >
                {isUpdating ? "Actualizando..." : "Actualizar Pago"}
              </Button>

              <Button
                variant="outline"
                className="ml-2"
                onClick={handleExportToPDF}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Exportar a PDF
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
