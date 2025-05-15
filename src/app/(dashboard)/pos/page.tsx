"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderHistory } from "@/components/pos/order-history";
import { NewOrder } from "@/components/pos/new-order";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam === "new" ? "new" : "history"
  );

  // Update the tab when URL changes
  useEffect(() => {
    setActiveTab(tabParam === "new" ? "new" : "history");
  }, [tabParam]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "history") {
      router.push("/pos");
    } else if (value === "new") {
      router.push("/pos?tab=new");
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Punto de Venta</h2>
        <p className="text-muted-foreground">
          Gestiona órdenes, ventas y productos en el punto de venta.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
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
