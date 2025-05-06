import {
  TableStatus,
  TableActivityLog,
  TableMaintenance,
  TableSession,
} from "@prisma/client";

export type Table = {
  id: string;
  name: string;
  status: TableStatus;
  hourlyRate: number | null;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TableFormValues = {
  name: string;
  status: TableStatus;
  hourlyRate?: number | null;
  companyId?: string;
};

export type TableStatusUpdateValues = {
  status: TableStatus;
  notes?: string;
};

export type TableWithDetails = Table & {
  activityLogs: Array<{
    id: string;
    previousStatus: TableStatus;
    newStatus: TableStatus;
    changedAt: Date;
    notes?: string | null;
    changedBy?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  }>;
  maintenances: Array<{
    id: string;
    description?: string | null;
    maintenanceAt: Date;
    cost?: number | null;
  }>;
  sessions: Array<{
    id: string;
    startedAt: Date;
    endedAt?: Date | null;
    totalCost?: number | null;
    status: string;
  }>;
};

export type TableWithBasicStats = Table & {
  sessionsCount: number;
  maintenanceCount: number;
};

export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  MAINTENANCE: "Maintenance",
};

export const TABLE_STATUS_COLORS: Record<TableStatus, string> = {
  AVAILABLE: "bg-green-100 text-green-800 border-green-300",
  OCCUPIED: "bg-blue-100 text-blue-800 border-blue-300",
  RESERVED: "bg-amber-100 text-amber-800 border-amber-300",
  MAINTENANCE: "bg-red-100 text-red-800 border-red-300",
};
