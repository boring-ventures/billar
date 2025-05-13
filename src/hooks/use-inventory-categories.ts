import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";

interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  items?: {
    id: string;
    name: string;
    quantity: number;
  }[];
}

interface CreateInventoryCategoryPayload {
  name: string;
  description?: string;
  companyId: string;
}

interface UpdateInventoryCategoryPayload {
  id: string;
  name: string;
  description?: string;
}

export const useInventoryCategories = (companyId?: string) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all inventory categories for a company
  const { data: categories, isLoading } = useQuery({
    queryKey: ["inventoryCategories", companyId],
    queryFn: async () => {
      try {
        if (!companyId) return [];

        const response = await axios.get(
          `/api/inventory-categories?companyId=${companyId}`
        );
        return response.data as InventoryCategory[];
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setError("Failed to load inventory categories.");
        return [];
      }
    },
    enabled: !!companyId,
  });

  // Fetch a single inventory category by ID
  const useCategory = (categoryId?: string) => {
    return useQuery({
      queryKey: ["inventoryCategory", categoryId],
      queryFn: async () => {
        try {
          if (!categoryId) return null;

          const response = await axios.get(
            `/api/inventory-categories/${categoryId}`
          );
          return response.data as InventoryCategory;
        } catch (error) {
          console.error("Failed to fetch category:", error);
          setError("Failed to load inventory category.");
          return null;
        }
      },
      enabled: !!categoryId,
    });
  };

  // Create a new inventory category
  const createCategory = useMutation({
    mutationFn: async (data: CreateInventoryCategoryPayload) => {
      try {
        const response = await axios.post("/api/inventory-categories", data);
        return response.data as InventoryCategory;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error || "Failed to create category.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      // Invalidate queries for the relevant company
      queryClient.invalidateQueries({
        queryKey: ["inventoryCategories", data.companyId],
      });
      // Also invalidate the current queries if companyId is provided
      if (companyId) {
        queryClient.invalidateQueries({
          queryKey: ["inventoryCategories", companyId],
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

  // Update an inventory category
  const updateCategory = useMutation({
    mutationFn: async (data: UpdateInventoryCategoryPayload) => {
      try {
        const response = await axios.put(
          `/api/inventory-categories/${data.id}`,
          {
            name: data.name,
            description: data.description,
          }
        );
        return response.data as InventoryCategory;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error || "Failed to update category.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      // Invalidate queries for the relevant company
      queryClient.invalidateQueries({
        queryKey: ["inventoryCategories", data.companyId],
      });
      // Also invalidate the current queries if companyId is provided
      if (companyId) {
        queryClient.invalidateQueries({
          queryKey: ["inventoryCategories", companyId],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["inventoryCategory", variables.id],
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

  // Delete an inventory category
  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      try {
        const response = await axios.delete(
          `/api/inventory-categories/${categoryId}`
        );
        return response.data;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error || "Failed to delete category.";
        throw new Error(errorMessage);
      }
    },
    onSuccess: (_, categoryId) => {
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      // If companyId is provided, invalidate those queries
      if (companyId) {
        queryClient.invalidateQueries({
          queryKey: ["inventoryCategories", companyId],
        });
      }
      // Invalidate all inventory categories queries to be safe
      queryClient.invalidateQueries({
        queryKey: ["inventoryCategories"],
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

  const clearError = () => setError(null);

  return {
    categories: categories || [],
    isLoading,
    error,
    clearError,
    useCategory,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
