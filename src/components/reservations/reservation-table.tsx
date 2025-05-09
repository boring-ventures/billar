"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, Edit } from "lucide-react";
import { useReservations } from "@/hooks/use-reservations";
import { ReservationDialog } from "./reservation-dialog";
import { ReservationStatusBadge } from "./reservation-status-badge";
import { formatDate } from "@/lib/utils";

export function ReservationTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: reservations = [], isLoading } = useReservations(searchQuery);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const { toast } = useToast();

  const handleSearch = () => {
    // The query will be automatically updated when searchQuery changes
    // No manual fetch needed with React Query
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCreateReservation = () => {
    setSelectedReservation(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditReservation = (reservation: any) => {
    setSelectedReservation(reservation);
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <Input
            placeholder="Search reservations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="max-w-xs"
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleCreateReservation}>
          <Plus className="h-4 w-4 mr-2" />
          New Reservation
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : !reservations || reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No reservations found
                </TableCell>
              </TableRow>
            ) : (
              reservations.map((reservation: any) => (
                <TableRow key={reservation.id}>
                  <TableCell>{reservation.id}</TableCell>
                  <TableCell>{reservation.customer?.name || 'Unknown'}</TableCell>
                  <TableCell>{reservation.table?.name || 'Unknown'}</TableCell>
                  <TableCell>{formatDate(reservation.startDate)}</TableCell>
                  <TableCell>{formatDate(reservation.endDate)}</TableCell>
                  <TableCell>
                    <ReservationStatusBadge status={reservation.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditReservation(reservation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ReservationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        reservation={selectedReservation}
      />
    </div>
  );
}
