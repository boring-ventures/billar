"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Play } from "lucide-react";
import { TableStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface TableHeaderProps {
  tableId: string;
  tableName: string;
  status: TableStatus;
  onStartSession: () => void;
}

export function TableHeader({
  tableId,
  tableName,
  status,
  onStartSession,
}: TableHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleEditTable = () => {
    router.push(`/tables/${tableId}/edit`);
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500/15 text-green-600";
      case "OCCUPIED":
        return "bg-red-500/15 text-red-600";
      case "RESERVED":
        return "bg-blue-500/15 text-blue-600";
      case "MAINTENANCE":
        return "bg-amber-500/15 text-amber-600";
      default:
        return "bg-gray-500/15 text-gray-600";
    }
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <Button onClick={handleBack} size="sm" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          {tableName}
        </h2>
        <Badge className={getStatusColor(status)}>{status}</Badge>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {status === "AVAILABLE" && (
          <Button onClick={onStartSession} size="sm">
            <Play className="mr-2 h-4 w-4" />
            Start Session
          </Button>
        )}
        <Button onClick={handleEditTable} size="sm" variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>
    </div>
  );
}
