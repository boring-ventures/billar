"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TableMaintenanceHistoryProps {
  tableId: string;
}

export function TableMaintenanceHistory({
  tableId,
}: TableMaintenanceHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Maintenance History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Maintenance history will be implemented in a future update.
        </div>
      </CardContent>
    </Card>
  );
}
