import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "./use-current-user";

interface DashboardStats {
  tablesCount: number;
  activeSessionsCount: number;
  inventoryItemsCount: number;
  lowStockItemsCount: number;
  todaySales: number;
  monthSales: number;
  todayOrdersCount: number;
  monthOrdersCount: number;
}

// Hook to fetch dashboard stats summary
export function useDashboardStats() {
  const { profile, isLoading: isLoadingProfile } = useCurrentUser();
  const companyId = profile?.companyId;

  return useQuery({
    queryKey: ["dashboardStats", companyId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!companyId) {
        return {
          tablesCount: 0,
          activeSessionsCount: 0,
          inventoryItemsCount: 0,
          lowStockItemsCount: 0,
          todaySales: 0,
          monthSales: 0,
          todayOrdersCount: 0,
          monthOrdersCount: 0,
        };
      }

      const response = await fetch(
        `/api/dashboard/stats?companyId=${companyId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return response.json();
    },
    enabled: !!companyId && !isLoadingProfile,
  });
}

// Hook to fetch sales summary for the chart
export function useSalesSummary(companyId?: string) {
  return useQuery({
    queryKey: ["salesSummary", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const response = await fetch(
        `/api/reports/sales-summary?companyId=${companyId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sales summary");
      }
      return response.json();
    },
    enabled: !!companyId,
  });
}

// Hook to fetch recent table sessions
export function useRecentTableSessions(
  companyId?: string,
  activeOnly: boolean = false
) {
  return useQuery({
    queryKey: ["recentTableSessions", companyId, activeOnly],
    queryFn: async () => {
      if (!companyId) return [];

      const url = `/api/tables/sessions?companyId=${companyId}${activeOnly ? "&active=true" : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch table sessions");
      }
      return response.json();
    },
    enabled: !!companyId,
  });
}

// Hook to fetch low stock items
export function useLowStockItems(companyId?: string) {
  return useQuery({
    queryKey: ["lowStockItems", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const response = await fetch(
        `/api/inventory/low-stock?companyId=${companyId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch low stock items");
      }
      return response.json();
    },
    enabled: !!companyId,
  });
}

// Hook to fetch recent orders
export function useRecentOrders(companyId?: string) {
  return useQuery({
    queryKey: ["recentOrders", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const response = await fetch(
        `/api/pos-orders?companyId=${companyId}&limit=5`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch recent orders");
      }
      const data = await response.json();
      // Handle paginated response format
      return data.data || data || [];
    },
    enabled: !!companyId,
  });
}
