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

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargando detalles de la orden...</DialogTitle>
          </DialogHeader>
          <div className="p-6">Cargando...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Orden no encontrada</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            No se pudieron cargar los detalles de la orden.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalles de la Orden #{order.id.substring(0, 8)}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToPDF}
              className="ml-4"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </DialogTitle>
          <DialogDescription>
            Orden creada el{" "}
            {format(new Date(order.createdAt), "dd/MM/yyyy 'a las' HH:mm")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Información de la Orden
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    ID de Orden
                  </label>
                  <p className="font-mono text-sm">
                    {order.id.substring(0, 8)}...
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Estado de Pago
                  </label>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        order.paymentStatus === "PAID" ? "default" : "secondary"
                      }
                      className={
                        order.paymentStatus === "PAID"
                          ? "bg-green-500 text-white"
                          : ""
                      }
                    >
                      {getPaymentStatusText(order.paymentStatus)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Método de Pago
                  </label>
                  <p className="text-sm">
                    {getPaymentMethodText(order.paymentMethod)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Mesa
                  </label>
                  <p className="text-sm">
                    {order.tableSession?.table.name || "Sin mesa"}
                  </p>
                </div>
              </div>

              {order.staff && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Atendido por
                  </label>
                  <p className="text-sm">
                    {`${order.staff.firstName || ""} ${order.staff.lastName || ""}`.trim() ||
                      "Personal desconocido"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Update */}
          <Card>
            <CardHeader>
              <CardTitle>Actualizar Pago</CardTitle>
              <CardDescription>
                Modifica el método y estado de pago de la orden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Método de Pago</label>
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  defaultValue={order.paymentMethod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona método de pago" />
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
              <div>
                <label className="text-sm font-medium">Estado de Pago</label>
                <Select
                  value={paymentStatus}
                  onValueChange={setPaymentStatus}
                  defaultValue={order.paymentStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estado de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAID">Pagado</SelectItem>
                    <SelectItem value="UNPAID">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleUpdatePayment}
                disabled={isUpdating || (!paymentMethod && !paymentStatus)}
                className="w-full"
              >
                {isUpdating ? "Actualizando..." : "Actualizar Pago"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Artículos de la Orden</CardTitle>
            <CardDescription>
              Lista de productos incluidos en esta orden
            </CardDescription>
          </CardHeader>
          <CardContent>
            {order.orderItems && order.orderItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">
                      Precio Unitario
                    </TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.orderItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {item.item?.name || "Producto Desconocido"}
                          </p>
                          {item.item?.sku && (
                            <p className="text-sm text-muted-foreground">
                              SKU: {item.item.sku}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        Bs. {Number(item.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        Bs.{" "}
                        {(item.quantity * Number(item.unitPrice)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No se encontraron artículos en esta orden
              </div>
            )}
          </CardContent>

          {/* Order Summary */}
          <CardFooter className="border-t bg-muted/50">
            <div className="w-full space-y-2">
              {order.tableSession?.totalCost && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Costo de Mesa:</span>
                  <span>
                    Bs. {Number(order.tableSession.totalCost).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Subtotal de Productos:
                </span>
                <span>
                  Bs.{" "}
                  {order.orderItems
                    ?.reduce(
                      (sum, item) =>
                        sum + item.quantity * Number(item.unitPrice),
                      0
                    )
                    .toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total de la Orden:</span>
                <span>Bs. {Number(order.amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
