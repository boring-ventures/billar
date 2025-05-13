import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    name: string;
    quantity: number;
  }[];
}

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
}

interface StockMovement {
  id: string;
  itemId: string;
  quantity: number;
  type: "PURCHASE" | "SALE" | "ADJUSTMENT" | "RETURN" | "TRANSFER";
  costPrice: number | null;
  reason: string | null;
  reference: string | null;
  createdAt: string;
  createdBy: string | null;
  item?: {
    id: string;
    name: string;
    sku: string | null;
  };
}

interface UseInventoryCategoriesOptions {
  companyId?: string;
  enabled?: boolean;
}

interface UseInventoryItemsOptions {
  companyId?: string;
  categoryId?: string;
  lowStock?: boolean;
  enabled?: boolean;
}

interface UseStockMovementsOptions {
  itemId?: string;
  enabled?: boolean;
}

// Fetch inventory categories for a company
export const useInventoryCategoriesQuery = ({
  companyId,
  enabled = true,
}: UseInventoryCategoriesOptions) => {
  return useQuery({
    queryKey: ["inventoryCategories", companyId],
    queryFn: async () => {
      // If no companyId is provided, fetch all categories
      const url = companyId
        ? `/api/inventory-categories?companyId=${companyId}`
        : `/api/inventory-categories`;
      const response = await axios.get(url);
      return response.data as InventoryCategory[];
    },
    enabled: enabled,
  });
};

// Fetch a single inventory category
export const useInventoryCategoryQuery = (
  categoryId?: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["inventoryCategory", categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const response = await axios.get(
        `/api/inventory-categories/${categoryId}`
      );
      return response.data as InventoryCategory;
    },
    enabled: !!categoryId && enabled,
  });
};

// Fetch inventory items with filters
export const useInventoryItemsQuery = ({
  companyId,
  categoryId,
  lowStock,
  enabled = true,
}: UseInventoryItemsOptions) => {
  return useQuery({
    queryKey: ["inventoryItems", { companyId, categoryId, lowStock }],
    queryFn: async () => {
      let url = `/api/inventory-items`;
      const params = new URLSearchParams();

      if (companyId) {
        params.append("companyId", companyId);
      }
      if (categoryId) {
        params.append("categoryId", categoryId);
      }
      if (lowStock) {
        params.append("lowStock", "true");
      }

      // Add params to URL if we have any
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      return response.data as InventoryItem[];
    },
    enabled: enabled,
  });
};

// Fetch a single inventory item
export const useInventoryItemQuery = (itemId?: string, enabled = true) => {
  return useQuery({
    queryKey: ["inventoryItem", itemId],
    queryFn: async () => {
      if (!itemId) return null;
      const response = await axios.get(`/api/inventory-items/${itemId}`);
      return response.data as InventoryItem;
    },
    enabled: !!itemId && enabled,
  });
};

// Fetch stock movements for an item
export const useStockMovementsQuery = ({
  itemId,
  enabled = true,
}: UseStockMovementsOptions) => {
  return useQuery({
    queryKey: ["stockMovements", itemId],
    queryFn: async () => {
      if (!itemId) return [];
      const response = await axios.get(`/api/stock-movements?itemId=${itemId}`);
      return response.data as StockMovement[];
    },
    enabled: !!itemId && enabled,
  });
};

// Fetch a single stock movement
export const useStockMovementQuery = (movementId?: string, enabled = true) => {
  return useQuery({
    queryKey: ["stockMovement", movementId],
    queryFn: async () => {
      if (!movementId) return null;
      const response = await axios.get(`/api/stock-movements/${movementId}`);
      return response.data as StockMovement;
    },
    enabled: !!movementId && enabled,
  });
};

// Get low stock items for a company
export const useLowStockItemsQuery = (companyId?: string, enabled = true) => {
  return useQuery({
    queryKey: ["inventoryItems", { companyId, lowStock: true }],
    queryFn: async () => {
      console.log("useLowStockItemsQuery - companyId:", companyId);

      let url = `/api/inventory-items?lowStock=true`;
      if (companyId) {
        url += `&companyId=${companyId}`;
      }

      console.log("useLowStockItemsQuery - URL:", url);
      const response = await axios.get(url);
      console.log("useLowStockItemsQuery - Response:", response.data);

      return response.data as InventoryItem[];
    },
    enabled: enabled,
  });
};
