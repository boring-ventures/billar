import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";

// Stock movement types from Prisma schema
type MovementType = "PURCHASE" | "SALE" | "ADJUSTMENT" | "RETURN" | "TRANSFER";

interface StockMovement {
  id: string;
  itemId: string;
  quantity: number;
  type: MovementType;
  costPrice: number | null;
  reason: string | null;
  reference: string | null;
  createdAt: string;
  createdBy: string | null;
  item?: {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
  };
  creator?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  } | null;
}

interface CreateStockMovementPayload {
  itemId: string;
  quantity: number;
  type: MovementType;
  costPrice?: number;
  reason?: string;
  reference?: string;
}

interface UpdateStockMovementPayload {
  id: string;
  quantity: number;
  reason?: string;
  costPrice?: number;
}

// Define error response type
interface ErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export const useStockMovements = (itemId?: string) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all stock movements for an item
  const { data: movements, isLoading } = useQuery({
    queryKey: ["stockMovements", itemId],
    queryFn: async () => {
      try {
        if (!itemId) return [];

        const response = await axios.get(
          `/api/stock-movements?itemId=${itemId}`
        );
        return response.data as StockMovement[];
      } catch (error) {
        console.error("Failed to fetch stock movements:", error);
        setError("Error al cargar los movimientos de stock.");
        return [];
      }
    },
    enabled: !!itemId,
  });

  // Fetch a single stock movement by ID
  const useMovement = (movementId?: string) => {
    return useQuery({
      queryKey: ["stockMovement", movementId],
      queryFn: async () => {
        try {
          if (!movementId) return null;

          const response = await axios.get(
            `/api/stock-movements/${movementId}`
          );
          return response.data as StockMovement;
        } catch (error) {
          console.error("Failed to fetch stock movement:", error);
          setError("Error al cargar el movimiento de stock.");
          return null;
        }
      },
      enabled: !!movementId,
    });
  };

  // Create a new stock movement
  const createMovement = useMutation({
    mutationFn: async (data: CreateStockMovementPayload) => {
      try {
        const response = await axios.post("/api/stock-movements", data);
        return response.data;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Error al crear el movimiento de stock."
              : "Error al crear el movimiento de stock.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Movimiento de stock registrado exitosamente",
      });

      // Invalidate stock movements for this item
      queryClient.invalidateQueries({ queryKey: ["stockMovements", itemId] });

      // Invalidate the item query to update quantity
      queryClient.invalidateQueries({ queryKey: ["inventoryItem", itemId] });

      // Invalidate inventory items list to reflect updated quantities
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

  // Update a stock movement (only for ADJUSTMENT type)
  const updateMovement = useMutation({
    mutationFn: async (data: UpdateStockMovementPayload) => {
      try {
        const response = await axios.put(`/api/stock-movements/${data.id}`, {
          quantity: data.quantity,
          reason: data.reason,
          costPrice: data.costPrice,
        });
        return response.data;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Error al actualizar el movimiento de stock."
              : "Error al actualizar el movimiento de stock.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Movimiento de stock actualizado exitosamente",
      });

      // Invalidate stock movements for this item
      queryClient.invalidateQueries({ queryKey: ["stockMovements", itemId] });

      // Invalidate the specific movement
      queryClient.invalidateQueries({
        queryKey: ["stockMovement"],
        predicate: (query) => query.queryKey.length > 1,
      });

      // Invalidate the item query to update quantity
      queryClient.invalidateQueries({ queryKey: ["inventoryItem", itemId] });

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

  // Delete a stock movement (only for ADJUSTMENT type)
  const deleteMovement = useMutation({
    mutationFn: async (movementId: string) => {
      try {
        const response = await axios.delete(
          `/api/stock-movements/${movementId}`
        );
        return response.data;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as ErrorResponse)?.response?.data?.error ||
                "Error al eliminar el movimiento de stock."
              : "Error al eliminar el movimiento de stock.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Movimiento de stock eliminado exitosamente",
      });

      // Invalidate stock movements for this item
      queryClient.invalidateQueries({ queryKey: ["stockMovements", itemId] });

      // Invalidate the item query to update quantity
      queryClient.invalidateQueries({ queryKey: ["inventoryItem", itemId] });

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

  // Helper to get description for a movement type
  const getMovementTypeDescription = (type: MovementType) => {
    switch (type) {
      case "PURCHASE":
        return "Stock Purchase";
      case "SALE":
        return "Sale";
      case "ADJUSTMENT":
        return "Stock Adjustment";
      case "RETURN":
        return "Return";
      case "TRANSFER":
        return "Stock Transfer";
      default:
        return type;
    }
  };

  const clearError = () => setError(null);

  return {
    movements: movements || [],
    isLoading,
    error,
    clearError,
    useMovement,
    createMovement,
    updateMovement,
    deleteMovement,
    getMovementTypeDescription,
  };
};
