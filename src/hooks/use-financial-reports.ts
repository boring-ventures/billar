import { useQuery } from "@tanstack/react-query";
import { DateRange } from "@/components/ui/date-range-picker";

interface UseFinancialReportsProps {
  companyId?: string;
  reportType?: string;
  dateRange?: DateRange;
  enabled?: boolean;
}

export function useFinancialReports({
  companyId,
  reportType,
  dateRange,
  enabled = true,
}: UseFinancialReportsProps) {
  const queryEnabled =
    enabled && !!companyId && !!dateRange?.from && !!dateRange?.to;

  return useQuery({
    queryKey: ["financialReports", companyId, reportType, dateRange],
    queryFn: async () => {
      if (!companyId || !dateRange?.from || !dateRange?.to) {
        return [];
      }

      const params = new URLSearchParams({
        companyId,
        ...(reportType ? { reportType } : {}),
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      });

      const response = await fetch(`/api/financial-reports?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch financial reports");
      }

      return response.json();
    },
    enabled: queryEnabled,
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await fetch("/api/companies");
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      return response.json();
    },
  });
}
