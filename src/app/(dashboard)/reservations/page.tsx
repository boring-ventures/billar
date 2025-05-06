"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReservationTable } from "@/components/reservations/reservation-table";
import { CustomerTable } from "@/components/reservations/customer-table";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ReservationsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam === "customers" ? "customers" : "reservations"
  );

  // Update the tab when URL changes
  useEffect(() => {
    setActiveTab(tabParam === "customers" ? "customers" : "reservations");
  }, [tabParam]);

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Reservation System
        </h2>
        <p className="text-muted-foreground">
          Manage reservations and customers in the system.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>
        <TabsContent value="reservations" className="mt-6">
          <ReservationTable />
        </TabsContent>
        <TabsContent value="customers" className="mt-6">
          <CustomerTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
