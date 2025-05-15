import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Metadata } from "next";
import { OrderHistory } from "@/components/pos/order-history";
import { NewOrder } from "@/components/pos/new-order";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Punto de Venta",
  description: "Gestiona órdenes y ventas del punto de venta",
};

export default function PosPage() {
  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Punto de Venta</h2>
        <p className="text-muted-foreground">
          Gestiona órdenes, ventas y productos en el punto de venta.
        </p>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <div className="flex justify-between items-center">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="history">Historial de Órdenes</TabsTrigger>
            <TabsTrigger value="new">Nueva Orden</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6 border rounded-lg">
          <TabsContent value="history" className="p-6">
            <OrderHistory />
          </TabsContent>
          <TabsContent value="new" className="p-6">
            <NewOrder />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
