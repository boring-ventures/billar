"use client";

import { MovementType } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";

// Types for inventory categories
export type InventoryCategory = {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CategoryFormValues = {
  name: string;
  description?: string;
  companyId?: string;
};

// Types for inventory items
export type InventoryItem = {
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
};

export type ItemFormValues = {
  name: string;
  categoryId?: string;
  sku?: string;
  quantity: number;
  criticalThreshold: number;
  price?: number;
  stockAlerts: boolean;
};

// Types for stock movements
export type StockMovement = {
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
  };
};

export type StockMovementFormValues = {
  itemId: string;
  quantity: number;
  type: MovementType;
  costPrice?: number;
  reason?: string;
  reference?: string;
};

// Generic fetch function for API calls
async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T }> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Invalid JSON response" }));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Fetch Error:`, error);
    throw error;
  }
}

// Compatibility hook to provide the same API as the old useInventory hook
// This wraps the new hooks to maintain backward compatibility
export function useInventory() {
  const itemsQuery = useInventoryItems();
  const categoriesQuery = useInventoryCategories();
  const movementsQuery = useStockMovements();

  return {
    // State properties
    items: itemsQuery.data?.data || [],
    categories: categoriesQuery.data?.data || [],
    stockMovements: movementsQuery.data?.data || [],
    isLoading: itemsQuery.isLoading || categoriesQuery.isLoading || movementsQuery.isLoading,
    isSubmitting: false, // Always false since we use React Query's isPending now
    itemDetails: null, // Not needed with new approach

    // These functions are maintained for backward compatibility
    // but they don't do anything since React Query handles data fetching
    fetchItems: async () => {},
    fetchCategories: async () => {},
    fetchStockMovements: async () => {},
    fetchItemDetails: async () => {},
  };
}

// Inventory Categories Hooks
export function useInventoryCategories(searchQuery?: string) {
  const queryParams = new URLSearchParams();
  if (searchQuery) {
    queryParams.append("query", searchQuery);
  }

  return useQuery({
    queryKey: ["inventoryCategories", searchQuery],
    queryFn: () =>
      apiFetch<InventoryCategory[]>(
        `/api/inventory/categories?${queryParams.toString()}`
      ),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CategoryFormValues) =>
      apiFetch<InventoryCategory>("/api/inventory/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["inventoryCategories"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CategoryFormValues>;
    }) =>
      apiFetch<InventoryCategory>(`/api/inventory/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["inventoryCategories"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/inventory/categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["inventoryCategories"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });
}

// Inventory Items Hooks
export function useInventoryItems(filters?: {
  searchQuery?: string;
  lowStock?: boolean;
  categoryId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.searchQuery) {
    queryParams.append("query", filters.searchQuery);
  }
  if (filters?.lowStock) {
    queryParams.append("lowStock", "true");
  }
  if (filters?.categoryId) {
    queryParams.append("categoryId", filters.categoryId);
  }

  return useQuery({
    queryKey: ["inventoryItems", filters],
    queryFn: async () => {
      try {
        // Add cache-busting parameter to prevent stale cache issues
        queryParams.append("_t", Date.now().toString());
        
        const result = await apiFetch<InventoryItem[]>(
          `/api/inventory/items?${queryParams.toString()}`
        );
        return result;
      } catch (error) {
        console.error("Error fetching inventory items:", error);
        throw error;
      }
    },
    refetchOnWindowFocus: true, // Ensure fresh data on window focus
    retry: 2, // Retry failed requests
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ["inventoryItem", id],
    queryFn: () => apiFetch<InventoryItem>(`/api/inventory/items/${id}`),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: ItemFormValues) =>
      apiFetch<InventoryItem>("/api/inventory/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create item",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ItemFormValues>;
    }) =>
      apiFetch<InventoryItem>(`/api/inventory/items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ 
        queryKey: ["inventoryItem", variables.id] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/inventory/items/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });
}

// Stock Movement Hooks
export function useStockMovements(itemId?: string) {
  const queryParams = new URLSearchParams();
  if (itemId) {
    queryParams.append("itemId", itemId);
  }

  return useQuery({
    queryKey: ["stockMovements", itemId],
    queryFn: () =>
      apiFetch<StockMovement[]>(
        `/api/inventory/stock-movements?${queryParams.toString()}`
      ),
    enabled: !itemId || !!itemId, // Always enabled if no itemId, else only if itemId exists
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: StockMovementFormValues) =>
      apiFetch<StockMovement>("/api/inventory/stock-movements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: "Stock movement recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
      queryClient.invalidateQueries({ 
        queryKey: ["inventoryItem", variables.itemId] 
      });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record stock movement",
        variant: "destructive",
      });
    },
  });
}
