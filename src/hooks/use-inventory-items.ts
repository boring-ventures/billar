import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";

interface InventoryItem {
  id: string;
  companyId: string;
  categoryId: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  criticalThreshold: number;
  price: number | null;
  lastStockUpdate: string | null;
  stockAlerts: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
  };
  stockMovements?: {
    id: string;
    quantity: number;
    type: string;
    createdAt: string;
  }[];
}

interface InventoryItemFilters {
  companyId: string;
  categoryId?: string;
  search?: string;
  inStock?: boolean;
  belowThreshold?: boolean;
}

interface CreateInventoryItemPayload {
  name: string;
  companyId: string;
  categoryId?: string;
  sku?: string;
  quantity?: number;
  price?: number;
  criticalThreshold?: number;
  stockAlerts?: boolean;
  createInitialMovement?: boolean;
  initialCostPrice?: number;
}

interface UpdateInventoryItemPayload {
  id: string;
  name: string;
  categoryId?: string;
  sku?: string;
  price?: number;
  criticalThreshold?: number;
  stockAlerts?: boolean;
}

// Define error response type
interface ErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export const useInventoryItems = (filters: InventoryItemFilters) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  // Construct query string from filters
  const getQueryString = (filters: InventoryItemFilters) => {
    const params = new URLSearchParams();

    if (filters.companyId) {
      params.append("companyId", filters.companyId);
    }

    if (filters.categoryId) {
      params.append("categoryId", filters.categoryId);
    }

    if (filters.search) {
      params.append("search", filters.search);
    }

    if (filters.inStock !== undefined) {
      params.append("inStock", String(filters.inStock));
    }

    if (filters.belowThreshold !== undefined) {
      params.append("belowThreshold", String(filters.belowThreshold));
    }

    return params.toString();
  };

  // Fetch all inventory items with filters
  const { data: items, isLoading } = useQuery({
    queryKey: ["inventoryItems", filters],
    queryFn: async () => {
      try {
        if (!filters.companyId) return [];

        const queryString = getQueryString(filters);
        const response = await axios.get(`/api/inventory-items?${queryString}`);
        return response.data as InventoryItem[];
      } catch (error) {
        console.error("Failed to fetch inventory items:", error);
        setError("Failed to load inventory items.");
        return [];
      }
    },
    enabled: !!filters.companyId,
    // Configure staleTime to be shorter to ensure fresher data
    staleTime: 10 * 1000, // 10 seconds
    // Always refetch when component mounts or window gets focus
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch a single inventory item by ID
  const useInventoryItem = (itemId?: string) => {
    return useQuery({
      queryKey: ["inventoryItem", itemId],
      queryFn: async () => {
        try {
          if (!itemId) return null;

          const response = await axios.get(`/api/inventory-items/${itemId}`);
          return response.data as InventoryItem;
        } catch (error) {
          console.error("Failed to fetch inventory item:", error);
          setError("Failed to load inventory item.");
          return null;
        }
      },
      enabled: !!itemId,
    });
  };

  // Create a new inventory item
  const createItem = useMutation({
    mutationFn: async (data: CreateInventoryItemPayload) => {
      try {
        console.log("Creating inventory item with data:", data);
        const response = await axios.post("/api/inventory-items", data);
        return response.data as InventoryItem;
      } catch (error: unknown) {
        console.error("Error creating item:", error);

        // Enhanced error handling to extract the error message
        if (axios.isAxiosError(error) && error.response) {
          // Extract error message from response if available
          const serverError =
            error.response.data?.error || "Failed to create item.";
          throw new Error(serverError);
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Failed to create item."
              : "Failed to create item.";

        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems", filters] });
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

  // Update an inventory item
  const updateItem = useMutation({
    mutationFn: async (data: UpdateInventoryItemPayload) => {
      try {
        const response = await axios.put(`/api/inventory-items/${data.id}`, {
          name: data.name,
          categoryId: data.categoryId,
          sku: data.sku,
          price: data.price,
          criticalThreshold: data.criticalThreshold,
          stockAlerts: data.stockAlerts,
        });
        return response.data as InventoryItem;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Failed to update item."
              : "Failed to update item.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems", filters] });
      queryClient.invalidateQueries({
        queryKey: ["inventoryItem", variables.id],
      });

      // If the category is changed, invalidate the category queries as well
      if (variables.categoryId) {
        queryClient.invalidateQueries({
          queryKey: ["inventoryCategory", variables.categoryId],
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

  // Delete an inventory item
  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      try {
        const response = await axios.delete(`/api/inventory-items/${itemId}`);
        return response.data;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Failed to delete item."
              : "Failed to delete item.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems", filters] });
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

  // Clear error state
  const clearError = () => setError(null);

  return {
    items: items || [],
    isLoading,
    error,
    clearError,
    useInventoryItem,
    createItem,
    updateItem,
    deleteItem,
  };
};
