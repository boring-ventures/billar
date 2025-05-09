"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReservationTable } from "@/components/reservations/reservation-table";
import { CustomerTable } from "@/components/reservations/customer-table";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useReservationStats } from "@/hooks/use-reservations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Users, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReservationsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam === "customers" ? "customers" : "reservations"
  );

  const {
    pendingCount = 0,
    confirmedCount = 0,
    canceledCount = 0,
    completedCount = 0,
    totalCount = 0,
    isLoading = false
  } = useReservationStats() || {}; // Apply defensive pattern with default empty object

  // Update the tab when URL changes
  useEffect(() => {
    if (searchParams) {
      setActiveTab(tabParam === "customers" ? "customers" : "reservations");
    }
  }, [tabParam, searchParams]);

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
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{totalCount}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{confirmedCount}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{pendingCount}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceled</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{canceledCount}</div>
            )}
          </CardContent>
        </Card>
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
