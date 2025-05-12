"use client";

import { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReservationStatus, PaymentStatus, TableReservation } from "@prisma/client";
import { useReservations } from "@/hooks/use-reservations";

type ReservationWithDetails = TableReservation & {
  table: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    name: string;
  } | null;
};

export function ReservationList() {
  const { reservations, isLoading, fetchReservations } = useReservations();

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Button>New Reservation</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Table</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(reservations as ReservationWithDetails[]).map((reservation) => (
            <TableRow key={reservation.id}>
              <TableCell>{reservation.table.name}</TableCell>
              <TableCell>{reservation.customer?.name || "Walk-in"}</TableCell>
              <TableCell>
                {new Date(reservation.reservedFrom).toLocaleString()}
              </TableCell>
              <TableCell>
                {new Date(reservation.reservedTo).toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    reservation.status === ReservationStatus.CONFIRMED
                      ? "default"
                      : reservation.status === ReservationStatus.PENDING
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {reservation.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    reservation.paymentStatus === PaymentStatus.PAID
                      ? "default"
                      : "destructive"
                  }
                >
                  {reservation.paymentStatus}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 