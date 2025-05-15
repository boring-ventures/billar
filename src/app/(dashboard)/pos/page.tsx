import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Metadata } from "next";
import { OrderHistory } from "@/components/pos/order-history";
import { NewOrder } from "@/components/pos/new-order";

export const metadata: Metadata = {
  title: "Punto de Venta",
  description: "Gestiona órdenes y ventas del punto de venta",
};

export default function PosPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Punto de Venta</h1>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="history">Historial de Órdenes</TabsTrigger>
          <TabsTrigger value="new">Nueva Orden</TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="mt-6">
          <OrderHistory />
        </TabsContent>
        <TabsContent value="new" className="mt-6">
          <NewOrder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
