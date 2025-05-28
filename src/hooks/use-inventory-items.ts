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
  active: boolean;
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
  itemType?: "SALE" | "INTERNAL_USE";
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
  itemType?: string;
}

interface UpdateInventoryItemPayload {
  id: string;
  name: string;
  categoryId?: string;
  sku?: string;
  price?: number;
  criticalThreshold?: number;
  stockAlerts?: boolean;
  itemType?: string;
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

    if (filters.itemType) {
      params.append("itemType", filters.itemType);
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
        setError("Error al cargar los artículos del inventario.");
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
          setError("Error al cargar el artículo del inventario.");
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
            error.response.data?.error || "Error al crear el artículo.";
          throw new Error(serverError);
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Error al crear el artículo."
              : "Error al crear el artículo.";

        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Artículo creado exitosamente",
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
        console.log("Updating inventory item with data:", data);
        const response = await axios.put(
          `/api/inventory-items/${data.id}`,
          data
        );
        return response.data as InventoryItem;
      } catch (error: unknown) {
        console.error("Error updating item:", error);

        // Enhanced error handling to extract the error message
        if (axios.isAxiosError(error) && error.response) {
          const serverError =
            error.response.data?.error || "Error al actualizar el artículo.";
          throw new Error(serverError);
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Error al actualizar el artículo."
              : "Error al actualizar el artículo.";

        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Artículo actualizado exitosamente",
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

  // Toggle active status of an inventory item
  const toggleActiveItem = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      try {
        console.log("Toggling item active status:", { id, active });
        const response = await axios.patch(
          `/api/inventory-items/${id}/toggle-active`,
          { active }
        );
        return response.data;
      } catch (error: unknown) {
        console.error("Error toggling item active status:", error);

        // Enhanced error handling to extract the error message
        if (axios.isAxiosError(error) && error.response) {
          const serverError =
            error.response.data?.error ||
            "Error al cambiar el estado del artículo.";
          throw new Error(serverError);
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Error al cambiar el estado del artículo."
              : "Error al cambiar el estado del artículo.";

        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Éxito",
        description: data.message || "Estado del artículo actualizado",
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
                "Error al eliminar el artículo."
              : "Error al eliminar el artículo.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Artículo eliminado exitosamente",
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
    toggleActiveItem,
    deleteItem,
  };
};
