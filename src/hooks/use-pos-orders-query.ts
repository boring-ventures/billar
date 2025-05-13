import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePosOrders } from "./use-pos-orders";

// Types from base hook (could be exported from there instead)
type PaymentStatus = "PAID" | "UNPAID";

interface PosOrderFilters {
  companyId: string;
  tableSessionId?: string;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

interface OrderSummary {
  totalOrders: number;
  totalPaid: number;
  totalUnpaid: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

/**
 * Hook providing POS orders related functionality with React Query.
 * Provides order management, filtering, and specialized queries.
 */
export const usePosOrdersQuery = (initialFilters: PosOrderFilters) => {
  const [filters, setFilters] = useState<PosOrderFilters>({
    ...initialFilters,
    page: initialFilters.page || 1,
    limit: initialFilters.limit || 100,
  });

  // Use the base hook with our filters
  const {
    orders,
    pagination,
    isLoading,
    error,
    clearError,
    useOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    addOrderItem,
    updateOrderItem,
    removeOrderItem,
    getPaymentMethodText,
    getPaymentStatusText,
    calculateOrderTotal,
  } = usePosOrders(filters);

  // Pagination controls
  const nextPage = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      setFilters((prev) => ({
        ...prev,
        page: (prev.page || 1) + 1,
      }));
    }
  };

  const prevPage = () => {
    if (pagination && pagination.page > 1) {
      setFilters((prev) => ({
        ...prev,
        page: (prev.page || 2) - 1,
      }));
    }
  };

  const goToPage = (page: number) => {
    if (pagination && page >= 1 && page <= pagination.totalPages) {
      setFilters((prev) => ({
        ...prev,
        page,
      }));
    }
  };

  const setPageSize = (limit: number) => {
    setFilters((prev) => ({
      ...prev,
      limit,
      page: 1, // Reset to first page when changing page size
    }));
  };

  // Get orders for a specific table session
  const useTableSessionOrders = (tableSessionId?: string) => {
    return useQuery({
      queryKey: ["tableSessionOrders", tableSessionId],
      queryFn: () => {
        if (!tableSessionId) return [];
        return orders.filter(
          (order) => order.tableSessionId === tableSessionId
        );
      },
      enabled: !!tableSessionId && !isLoading,
    });
  };

  // Get orders for today
  const useTodayOrders = (companyId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayFilters: PosOrderFilters = {
      companyId,
      dateFrom: today.toISOString(),
      dateTo: new Date().toISOString(),
    };

    const { orders: todayOrders, isLoading: isTodayOrdersLoading } =
      usePosOrders(todayFilters);

    return {
      orders: todayOrders,
      isLoading: isTodayOrdersLoading,
    };
  };

  // Get orders for a date range
  const useDateRangeOrders = (
    companyId: string,
    dateFrom: string,
    dateTo: string
  ) => {
    const dateRangeFilters: PosOrderFilters = {
      companyId,
      dateFrom,
      dateTo,
    };

    const { orders: dateRangeOrders, isLoading: isDateRangeOrdersLoading } =
      usePosOrders(dateRangeFilters);

    return {
      orders: dateRangeOrders,
      isLoading: isDateRangeOrdersLoading,
    };
  };

  // Get orders by payment status
  const useOrdersByPaymentStatus = (
    companyId: string,
    paymentStatus: PaymentStatus
  ) => {
    const statusFilters: PosOrderFilters = {
      companyId,
      paymentStatus,
    };

    const { orders: statusOrders, isLoading: isStatusOrdersLoading } =
      usePosOrders(statusFilters);

    return {
      orders: statusOrders,
      isLoading: isStatusOrdersLoading,
    };
  };

  // Get order summary statistics
  const useOrderSummary = (
    companyId?: string,
    dateFrom?: string,
    dateTo?: string
  ) => {
    return useQuery({
      queryKey: ["orderSummary", companyId, dateFrom, dateTo],
      queryFn: async () => {

        // Get the data directly without calling a hook inside queryFn
        try {
          const queryString = new URLSearchParams();
          if (companyId) queryString.append("companyId", companyId);
          if (dateFrom) queryString.append("dateFrom", dateFrom);
          if (dateTo) queryString.append("dateTo", dateTo);

          const response = await fetch(
            `/api/pos-orders?${queryString.toString()}`
          );
          const data = await response.json();

          // Handle the new response format with pagination
          const summaryOrders = data.data || data;

          if (!summaryOrders || !summaryOrders.length) {
            return {
              totalOrders: 0,
              totalPaid: 0,
              totalUnpaid: 0,
              totalAmount: 0,
              paidAmount: 0,
              unpaidAmount: 0,
            } as OrderSummary;
          }

          const summary: OrderSummary = {
            totalOrders: summaryOrders.length,
            totalPaid: summaryOrders.filter(
              (order: { paymentStatus: string }) =>
                order.paymentStatus === "PAID"
            ).length,
            totalUnpaid: summaryOrders.filter(
              (order: { paymentStatus: string }) =>
                order.paymentStatus === "UNPAID"
            ).length,
            totalAmount: summaryOrders.reduce(
              (sum: number, order: { amount?: number }) =>
                sum + (order.amount || 0),
              0
            ),
            paidAmount: summaryOrders
              .filter(
                (order: { paymentStatus: string }) =>
                  order.paymentStatus === "PAID"
              )
              .reduce(
                (sum: number, order: { amount?: number }) =>
                  sum + (order.amount || 0),
                0
              ),
            unpaidAmount: summaryOrders
              .filter(
                (order: { paymentStatus: string }) =>
                  order.paymentStatus === "UNPAID"
              )
              .reduce(
                (sum: number, order: { amount?: number }) =>
                  sum + (order.amount || 0),
                0
              ),
          };

          return summary;
        } catch (error) {
          console.error("Failed to fetch orders for summary:", error);
          return {
            totalOrders: 0,
            totalPaid: 0,
            totalUnpaid: 0,
            totalAmount: 0,
            paidAmount: 0,
            unpaidAmount: 0,
          } as OrderSummary;
        }
      },
      enabled: true,
    });
  };

  // Update the current filters
  const updateFilters = (newFilters: Partial<PosOrderFilters>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  // Reset filters to initial state but keep companyId
  const resetFilters = () => {
    setFilters({
      companyId: filters.companyId,
      page: 1,
      limit: filters.limit || 100,
    });
  };

  // Get top selling items for a period
  const useTopSellingItems = (
    companyId?: string,
    limit = 5,
    dateFrom?: string,
    dateTo?: string
  ) => {
    return useQuery({
      queryKey: ["topSellingItems", companyId, limit, dateFrom, dateTo],
      queryFn: async () => {

        // Get the data directly without calling a hook inside queryFn
        try {
          const queryString = new URLSearchParams();
          if (companyId) queryString.append("companyId", companyId);
          if (dateFrom) queryString.append("dateFrom", dateFrom);
          if (dateTo) queryString.append("dateTo", dateTo);

          const response = await fetch(
            `/api/pos-orders?${queryString.toString()}`
          );
          const data = await response.json();

          // Handle the new response format with pagination
          const periodOrders = data.data || data;

          if (!periodOrders || !periodOrders.length) {
            return [];
          }

          // Extract all order items
          const allItems = periodOrders.flatMap(
            (order: {
              orderItems: Array<{
                itemId: string;
                item?: { name?: string };
                quantity: number;
                unitPrice: number | string;
              }>;
            }) => order.orderItems
          );

          // Group by item ID and sum quantities
          const itemSales = allItems.reduce(
            (
              acc: Record<
                string,
                {
                  itemId: string;
                  itemName: string;
                  totalQuantity: number;
                  totalSales: number;
                }
              >,
              item: {
                itemId: string;
                item?: { name?: string };
                quantity: number;
                unitPrice: number | string;
              }
            ) => {
              const itemId = item.itemId;
              if (!acc[itemId]) {
                acc[itemId] = {
                  itemId,
                  itemName: item.item?.name || "Unknown Item",
                  totalQuantity: 0,
                  totalSales: 0,
                };
              }

              acc[itemId].totalQuantity += item.quantity;
              acc[itemId].totalSales += item.quantity * Number(item.unitPrice);

              return acc;
            },
            {} as Record<
              string,
              {
                itemId: string;
                itemName: string;
                totalQuantity: number;
                totalSales: number;
              }
            >
          );

          // Convert to array and sort by quantity
          const sortedItems = Object.values(itemSales)
            .sort((a, b) => {
              const itemA = a as { totalQuantity: number };
              const itemB = b as { totalQuantity: number };
              return itemB.totalQuantity - itemA.totalQuantity;
            })
            .slice(0, limit);

          return sortedItems;
        } catch (error) {
          console.error("Failed to fetch orders for top selling items:", error);
          return [];
        }
      },
      enabled: true,
    });
  };

  return {
    orders,
    pagination,
    isLoading,
    error,
    clearError,
    filters,
    updateFilters,
    resetFilters,
    // Pagination controls
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
    useOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    addOrderItem,
    updateOrderItem,
    removeOrderItem,
    useTableSessionOrders,
    useTodayOrders,
    useDateRangeOrders,
    useOrdersByPaymentStatus,
    useOrderSummary,
    useTopSellingItems,
    getPaymentMethodText,
    getPaymentStatusText,
    calculateOrderTotal,
  };
};
