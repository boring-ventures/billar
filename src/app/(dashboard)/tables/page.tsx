"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TableList } from "@/components/tables/table-list";
import { ReservationList } from "@/components/tables/reservation-list";

export default function TablesPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam === "reservations" ? "reservations" : "tables"
  );

  // Update the tab when URL changes
  useEffect(() => {
    setActiveTab(tabParam === "reservations" ? "reservations" : "tables");
  }, [tabParam]);

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Table Management</h2>
        <p className="text-muted-foreground">
          Manage tables, sessions, and reservations in the system.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
        </TabsList>
        <TabsContent value="tables" className="mt-6">
          <TableList />
        </TabsContent>
        <TabsContent value="reservations" className="mt-6">
          <ReservationList />
        </TabsContent>
      </Tabs>
    </div>
  );
} 