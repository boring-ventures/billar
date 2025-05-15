import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";

// Types from Prisma schema
type PaymentMethod = "CASH" | "QR" | "CREDIT_CARD";
type PaymentStatus = "PAID" | "UNPAID";

// Order item interface
interface PosOrderItem {
  id: string;
  orderId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  item?: {
    id: string;
    name: string;
    sku: string | null;
    price: number | null;
  };
}

// Main POS order interface
interface PosOrder {
  id: string;
  companyId: string;
  staffId: string | null;
  tableSessionId: string | null;
  amount: number | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  orderItems: PosOrderItem[];
  tableSession?: {
    id: string;
    startedAt: string;
    endedAt: string | null;
    totalCost: number | null;
    table: {
      id: string;
      name: string;
      hourlyRate?: number | null;
    };
  };
  company?: {
    id: string;
    name: string;
  };
}

// Filters for fetching orders
interface PosOrderFilters {
  companyId: string;
  tableSessionId?: string;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
}

// Payload for creating an order
interface CreatePosOrderPayload {
  companyId: string;
  tableSessionId?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  items: {
    itemId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// Payload for updating an order
interface UpdatePosOrderPayload {
  id: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
}

// Payload for creating/updating order items
interface OrderItemPayload {
  orderId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
}

// Payload for updating order item quantity
interface UpdateOrderItemQuantityPayload {
  id: string;
  quantity: number;
}

// Error response type
interface ErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export const usePosOrders = (filters: PosOrderFilters) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Construct query string from filters
  const getQueryString = (filters: PosOrderFilters) => {
    const params = new URLSearchParams();

    if (filters.companyId) {
      params.append("companyId", filters.companyId);
    }

    if (filters.tableSessionId) {
      params.append("tableSessionId", filters.tableSessionId);
    }

    if (filters.paymentStatus) {
      params.append("paymentStatus", filters.paymentStatus);
    }

    if (filters.dateFrom) {
      params.append("dateFrom", filters.dateFrom);
    }

    if (filters.dateTo) {
      params.append("dateTo", filters.dateTo);
    }

    return params.toString();
  };

  // Fetch all POS orders with filters
  const { data, isLoading } = useQuery({
    queryKey: ["posOrders", filters],
    queryFn: async () => {
      try {
        const queryString = getQueryString(filters);
        const response = await axios.get(`/api/pos-orders?${queryString}`);

        // Handle the new response format with pagination
        if (response.data.data && response.data.pagination) {
          return {
            orders: response.data.data as PosOrder[],
            pagination: response.data.pagination,
          };
        }

        // Handle backward compatibility with old format
        return {
          orders: Array.isArray(response.data)
            ? response.data
            : ([] as PosOrder[]),
          pagination: null,
        };
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        setError("Failed to load POS orders.");
        return { orders: [], pagination: null };
      }
    },
    enabled: true,
  });

  // Extract orders and pagination from the response
  const orders = data?.orders || [];
  const pagination = data?.pagination;

  // Fetch a single POS order by ID
  const useOrder = (orderId?: string) => {
    return useQuery({
      queryKey: ["posOrder", orderId],
      queryFn: async () => {
        try {
          if (!orderId) return null;

          const response = await axios.get(`/api/pos-orders/${orderId}`);
          return response.data as PosOrder;
        } catch (error) {
          console.error("Failed to fetch order:", error);
          setError("Failed to load POS order.");
          return null;
        }
      },
      enabled: !!orderId,
    });
  };

  // Create a new POS order
  const createOrder = useMutation({
    mutationFn: async (data: CreatePosOrderPayload) => {
      try {
        // Special case for session-payment: check if this is a session-only payment
        const hasOnlySessionPayment =
          data.items.length === 1 &&
          data.items[0].itemId === "session-payment" &&
          data.tableSessionId;

        // If it's a session-only payment, we'll allow it through with special handling
        if (hasOnlySessionPayment) {
          console.log("Creating order with session-payment only");
        } else {
          // For regular orders, ensure all items have valid IDs
          const invalidItems = data.items.filter(
            (item) =>
              item.itemId === "session-payment" ||
              !item.itemId ||
              item.quantity <= 0 ||
              item.unitPrice <= 0
          );

          if (invalidItems.length > 0) {
            throw new Error("Order contains invalid items");
          }
        }

        const response = await axios.post("/api/pos-orders", data);
        return response.data;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Failed to create order."
              : "Failed to create order.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Orden creada exitosamente",
      });

      // Invalidate orders
      queryClient.invalidateQueries({ queryKey: ["posOrders"] });

      // Invalidate inventory items to reflect stock changes
      queryClient.invalidateQueries({
        queryKey: ["inventoryItems"],
        predicate: (query) => query.queryKey.length > 1,
      });

      // If table session id exists, invalidate table sessions
      if (filters.tableSessionId) {
        queryClient.invalidateQueries({
          queryKey: ["tableSession", filters.tableSessionId],
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setError(error.message);
    },
  });

  // Update a POS order (payment status, payment method)
  const updateOrder = useMutation({
    mutationFn: async (data: UpdatePosOrderPayload) => {
      try {
        const response = await axios.patch(`/api/pos-orders/${data.id}`, {
          paymentStatus: data.paymentStatus,
          paymentMethod: data.paymentMethod,
        });
        return response.data as PosOrder;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Failed to update order."
              : "Failed to update order.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Éxito",
        description: "Orden actualizada exitosamente",
      });

      // Invalidate orders list with broader pattern
      queryClient.invalidateQueries({ queryKey: ["posOrders"] });

      // Invalidate the specific order
      queryClient.invalidateQueries({ queryKey: ["posOrder", variables.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setError(error.message);
    },
  });

  // Delete a POS order
  const deleteOrder = useMutation({
    mutationFn: async (orderId: string) => {
      try {
        const response = await axios.delete(`/api/pos-orders/${orderId}`);
        return response.data;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Failed to delete order."
              : "Failed to delete order.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Orden eliminada exitosamente",
      });

      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: ["posOrders"] });

      // Invalidate inventory items to reflect stock changes
      queryClient.invalidateQueries({
        queryKey: ["inventoryItems"],
        predicate: (query) => query.queryKey.length > 1,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setError(error.message);
    },
  });

  // Add item to an order
  const addOrderItem = useMutation({
    mutationFn: async (data: OrderItemPayload) => {
      try {
        const response = await axios.post("/api/pos-orders/items", data);
        return response.data;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Failed to add item to order."
              : "Failed to add item to order.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Éxito",
        description: "Artículo añadido a la orden exitosamente",
      });

      // Invalidate the specific order
      queryClient.invalidateQueries({
        queryKey: ["posOrder", variables.orderId],
      });

      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: ["posOrders"] });

      // Invalidate inventory item to reflect stock changes
      queryClient.invalidateQueries({
        queryKey: ["inventoryItem", variables.itemId],
      });

      // Invalidate inventory items list
      queryClient.invalidateQueries({
        queryKey: ["inventoryItems"],
        predicate: (query) => query.queryKey.length > 1,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setError(error.message);
    },
  });

  // Update order item quantity
  const updateOrderItem = useMutation({
    mutationFn: async (data: UpdateOrderItemQuantityPayload) => {
      try {
        const response = await axios.put(
          `/api/pos-orders/items?id=${data.id}`,
          {
            quantity: data.quantity,
          }
        );
        return response.data;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Failed to update order item."
              : "Failed to update order item.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Artículo de la orden actualizado exitosamente",
      });

      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: ["posOrders"] });

      // Invalidate all orders as we don't know the specific one here
      queryClient.invalidateQueries({
        queryKey: ["posOrder"],
        predicate: (query) => query.queryKey.length > 1,
      });

      // Invalidate inventory items to reflect stock changes
      queryClient.invalidateQueries({
        queryKey: ["inventoryItems"],
        predicate: (query) => query.queryKey.length > 1,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setError(error.message);
    },
  });

  // Remove item from an order
  const removeOrderItem = useMutation({
    mutationFn: async (orderItemId: string) => {
      try {
        const response = await axios.delete(
          `/api/pos-orders/items?id=${orderItemId}`
        );
        return response.data;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Failed to remove item from order."
              : "Failed to remove item from order.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Artículo eliminado de la orden exitosamente",
      });

      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: ["posOrders"] });

      // Invalidate all orders as we don't know the specific one
      queryClient.invalidateQueries({
        queryKey: ["posOrder"],
        predicate: (query) => query.queryKey.length > 1,
      });

      // Invalidate inventory items to reflect stock changes
      queryClient.invalidateQueries({
        queryKey: ["inventoryItems"],
        predicate: (query) => query.queryKey.length > 1,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setError(error.message);
    },
  });

  // Helper to get formatted payment method text
  const getPaymentMethodText = (method: PaymentMethod) => {
    switch (method) {
      case "CASH":
        return "Efectivo";
      case "QR":
        return "Pago QR";
      case "CREDIT_CARD":
        return "Tarjeta de Crédito";
      default:
        return method;
    }
  };

  // Helper to get formatted payment status text
  const getPaymentStatusText = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return "Pagado";
      case "UNPAID":
        return "Pendiente";
      default:
        return status;
    }
  };

  // Helper to calculate total price for all items in an order
  const calculateOrderTotal = (items: PosOrderItem[]) => {
    return items.reduce((total, item) => {
      return total + item.quantity * Number(item.unitPrice);
    }, 0);
  };

  const clearError = () => setError(null);

  return {
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
  };
};
