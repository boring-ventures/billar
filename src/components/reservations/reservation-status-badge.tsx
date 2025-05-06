"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELED" | "COMPLETED";

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
}

export function ReservationStatusBadge({
  status,
}: ReservationStatusBadgeProps) {
  switch (status) {
    case "PENDING":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1"
        >
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
        >
          <CheckCircle2 className="h-3 w-3" />
          Confirmed
        </Badge>
      );
    case "CANCELED":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1"
        >
          <XCircle className="h-3 w-3" />
          Canceled
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
        >
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1"
        >
          <AlertCircle className="h-3 w-3" />
          Unknown
        </Badge>
      );
  }
}
