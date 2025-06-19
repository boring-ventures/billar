"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface SalesSummaryChartProps {
  companyId: string;
}

interface SalesData {
  date: string;
  posAmount: number;
  tableAmount: number;
}

export function SalesSummaryChart({ companyId }: SalesSummaryChartProps) {
  const { data: salesData, isLoading } = useQuery({
    queryKey: ["salesSummary", companyId],
    queryFn: async () => {
      const response = await fetch(
        `/api/reports/sales-summary?companyId=${companyId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sales summary");
      }
      return response.json();
    },
  });

  // Fetch company business hours to determine if business day filtering is active
  const { data: company } = useQuery({
    queryKey: ["companyBusinessHours", companyId],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch company data");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  const hasBusinessHours =
    company &&
    ((company.useIndividualHours && company.individualDayHours) ||
      (company.businessHoursStart && company.businessHoursEnd));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[350px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If there's no data, display a placeholder chart
  if (!salesData || salesData.length === 0) {
    // Create dummy data for placeholder
    const dummyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 6 + i);
      const day = date.toLocaleDateString("es-ES", { weekday: "short" });

      return {
        name: day,
        ventas: 0,
        mesas: 0,
      };
    });

    return (
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dummyData}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Bar
              dataKey="ventas"
              name="Ventas POS"
              className="fill-primary"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="mesas"
              name="Alquiler de Mesas"
              className="fill-blue-400"
              radius={[4, 4, 0, 0]}
            />
            <Legend />
          </BarChart>
        </ResponsiveContainer>
        <div className="text-center text-sm text-muted-foreground pt-2">
          No hay datos de ventas disponibles para mostrar.
        </div>
        {hasBusinessHours && (
          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-blue-600">
            <Info className="h-3 w-3" />
            <span>
              Datos filtrados por días de negocio según horarios configurados
            </span>
          </div>
        )}
      </div>
    );
  }

  // Format the data for the chart
  const formattedData = salesData.map((day: SalesData) => ({
    name: day.date,
    ventas: day.posAmount || 0,
    mesas: day.tableAmount || 0,
  }));

  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData}>
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
          />
          <Bar
            dataKey="ventas"
            name="Ventas POS"
            className="fill-primary"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="mesas"
            name="Alquiler de Mesas"
            className="fill-blue-400"
            radius={[4, 4, 0, 0]}
          />
          <Legend />
        </BarChart>
      </ResponsiveContainer>
      {hasBusinessHours && (
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-blue-600">
          <Info className="h-3 w-3" />
          <span>
            Datos filtrados por días de negocio según horarios configurados
          </span>
        </div>
      )}
    </div>
  );
}
