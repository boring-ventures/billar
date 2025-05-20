"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface RecentTableSessionsProps {
  companyId: string;
  activeOnly?: boolean;
}

interface TableData {
  id: string;
  name: string;
  hourlyRate: number;
}

interface TableSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  totalCost: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  table: TableData;
}

export function RecentTableSessions({
  companyId,
  activeOnly = false,
}: RecentTableSessionsProps) {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["tableSessions", companyId, activeOnly],
    queryFn: async () => {
      const url = `/api/tables/sessions?companyId=${companyId}${activeOnly ? "&active=true" : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mesa</TableHead>
            <TableHead>Inicio</TableHead>
            <TableHead>Duración</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Costo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions && sessions.length > 0 ? (
            sessions.slice(0, 5).map((session: TableSession) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium">
                  {session.table.name}
                </TableCell>
                <TableCell>
                  {format(new Date(session.startedAt), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(session.startedAt), {
                    addSuffix: false,
                    locale: es,
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      session.status === "ACTIVE" ? "default" : "outline"
                    }
                  >
                    {session.status === "ACTIVE" ? "Activa" : "Finalizada"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(session.totalCost || 0)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No hay sesiones {activeOnly ? "activas" : ""} registradas.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
