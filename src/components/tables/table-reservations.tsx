"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TableReservationsProps {
  tableId: string;
}

export function TableReservations({ tableId }: TableReservationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Reservations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Reservation management will be implemented in a future update.
        </div>
      </CardContent>
    </Card>
  );
}
