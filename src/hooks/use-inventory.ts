"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { MovementType } from "@prisma/client";

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
  companyId?: string;
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

export function useInventory() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemDetails, setItemDetails] = useState<InventoryItem | null>(null);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Operations
  const fetchCategories = useCallback(
    async (searchQuery?: string) => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();
        if (searchQuery) {
          queryParams.append("query", searchQuery);
        }

        const response = await fetch(
          `/api/inventory/categories?${queryParams.toString()}`
        );
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch categories",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const createCategory = useCallback(
    async (categoryData: CategoryFormValues) => {
      try {
        setIsSubmitting(true);
        const response = await fetch("/api/inventory/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryData),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Category created successfully",
          });
          await fetchCategories();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to create category",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error creating category:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchCategories, toast]
  );

  const updateCategory = useCallback(
    async (categoryId: string, categoryData: Partial<CategoryFormValues>) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(
          `/api/inventory/categories/${categoryId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(categoryData),
          }
        );

        if (response.ok) {
          toast({
            title: "Success",
            description: "Category updated successfully",
          });
          await fetchCategories();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to update category",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error updating category:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchCategories, toast]
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(
          `/api/inventory/categories/${categoryId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          toast({
            title: "Success",
            description: "Category deleted successfully",
          });
          await fetchCategories();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to delete category",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchCategories, toast]
  );

  // Item Operations
  const fetchItems = useCallback(
    async (searchQuery?: string, lowStock?: boolean) => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();
        if (searchQuery) {
          queryParams.append("query", searchQuery);
        }
        if (lowStock) {
          queryParams.append("lowStock", "true");
        }

        const response = await fetch(
          `/api/inventory/items?${queryParams.toString()}`
        );
        if (response.ok) {
          const data = await response.json();
          setItems(data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch inventory items",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching inventory items:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const fetchItemDetails = useCallback(
    async (itemId: string) => {
      try {
        setIsDetailLoading(true);
        const response = await fetch(`/api/inventory/items/${itemId}`);

        if (response.ok) {
          const data = await response.json();
          setItemDetails(data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch item details",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching item details:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsDetailLoading(false);
      }
    },
    [toast]
  );

  const createItem = useCallback(
    async (itemData: ItemFormValues) => {
      try {
        setIsSubmitting(true);
        const response = await fetch("/api/inventory/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemData),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Item created successfully",
          });
          await fetchItems();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to create item",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error creating item:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchItems, toast]
  );

  const updateItem = useCallback(
    async (itemId: string, itemData: Partial<ItemFormValues>) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/inventory/items/${itemId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemData),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Item updated successfully",
          });
          await fetchItems();
          if (itemDetails) {
            await fetchItemDetails(itemId);
          }
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to update item",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error updating item:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchItems, fetchItemDetails, itemDetails, toast]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/inventory/items/${itemId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Item deleted successfully",
          });
          await fetchItems();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to delete item",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error deleting item:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchItems, toast]
  );

  // Stock Movement Operations
  const fetchStockMovements = useCallback(
    async (itemId?: string) => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();
        if (itemId) {
          queryParams.append("itemId", itemId);
        }

        const response = await fetch(
          `/api/inventory/stock-movements?${queryParams.toString()}`
        );
        if (response.ok) {
          const data = await response.json();
          setStockMovements(data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch stock movements",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching stock movements:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const createStockMovement = useCallback(
    async (movementData: StockMovementFormValues) => {
      try {
        setIsSubmitting(true);
        const response = await fetch("/api/inventory/stock-movements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(movementData),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Stock movement recorded successfully",
          });
          if (movementData.itemId) {
            await fetchStockMovements(movementData.itemId);
            await fetchItemDetails(movementData.itemId);
          } else {
            await fetchStockMovements();
          }
          await fetchItems();
          return true;
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to record stock movement",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Error recording stock movement:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchStockMovements, fetchItemDetails, fetchItems, toast]
  );

  return {
    // State
    categories,
    items,
    itemDetails,
    stockMovements,
    isLoading,
    isDetailLoading,
    isSubmitting,

    // Category functions
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,

    // Item functions
    fetchItems,
    fetchItemDetails,
    createItem,
    updateItem,
    deleteItem,

    // Stock movement functions
    fetchStockMovements,
    createStockMovement,
  };
}
