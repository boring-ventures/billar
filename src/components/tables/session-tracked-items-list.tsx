"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ClipboardList, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TrackedItem {
  id: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  item?: {
    name: string;
    price: number;
  };
}

interface SessionTrackedItemsListProps {
  sessionId: string;
  showHeading?: boolean;
  showCard?: boolean;
}

// Define an interface for the query cache event
interface QueryCacheEvent {
  type: string;
  query?: {
    queryKey?: unknown[];
  };
}

export function SessionTrackedItemsList({
  sessionId,
  showHeading = true,
  showCard = true,
}: SessionTrackedItemsListProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [trackedItems, setTrackedItems] = useState<TrackedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingItems, setRemovingItems] = useState<Record<string, boolean>>(
    {}
  );
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Fetch tracked items function that can be called when needed
  const fetchTrackedItems = useCallback(
    async (isManualRefresh = false) => {
      if (!sessionId) return;

      if (isManualRefresh) {
        setIsManualRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const response = await fetch(
          `/api/table-sessions/${sessionId}/tracked-items`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch tracked items");
        }

        const data = await response.json();
        setTrackedItems(data || []);

        // Update query cache
        queryClient.setQueryData(["trackedItems", sessionId], data);

        // When refreshing tracked items, also invalidate inventory items to ensure counts are in sync
        const tableSession = await fetch(
          `/api/table-sessions/${sessionId}`
        ).then((res) => res.json());
        const companyId =
          tableSession?.table?.company?.id || tableSession?.table?.companyId;

        if (companyId) {
          queryClient.invalidateQueries({
            queryKey: ["inventoryItems", companyId],
          });
        }
      } catch (error) {
        console.error("Error fetching tracked items:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch tracked items"
        );
      } finally {
        setIsLoading(false);
        if (isManualRefresh) {
          setIsManualRefreshing(false);
        }
      }
    },
    [sessionId, queryClient]
  );

  // Handle manual refresh
  const handleManualRefresh = () => {
    fetchTrackedItems(true);
  };

  // Auto-refresh on an interval
  useEffect(() => {
    // Set up auto-refresh interval (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchTrackedItems();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchTrackedItems]);

  // Handle removing a tracked item
  const handleRemoveItem = async (itemId: string, itemName: string) => {
    // Remove the confirmation dialog that might be causing issues
    setRemovingItems((prev) => ({ ...prev, [itemId]: true }));

    try {
      // Find the tracked item that's being removed
      const trackedItem = trackedItems.find((item) => item.id === itemId);
      if (!trackedItem) {
        throw new Error("Item not found");
      }

      // Store the item details for optimistic update
      const { itemId: inventoryItemId, quantity } = trackedItem;

      // Get the companyId before deletion
      const tableSession = await fetch(`/api/table-sessions/${sessionId}`).then(
        (res) => res.json()
      );
      const companyId =
        tableSession?.table?.company?.id || tableSession?.table?.companyId;

      // Create a specific flag to indicate inventory is being updated due to item removal
      // This flag will be used by other components to determine if the add item button should be disabled
      queryClient.setQueryData(["inventory-updating-state"], true);

      // First invalidate the inventory query to trigger refetch
      if (companyId) {
        // Force immediate invalidation of inventory items
        queryClient.invalidateQueries({
          queryKey: ["inventoryItems"],
          refetchType: "all",
        });
      }

      // Now perform the actual deletion
      const response = await fetch(
        `/api/table-sessions/${sessionId}/tracked-items/${itemId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove tracked item");
      }

      // Update local state
      setTrackedItems((prev) => prev.filter((item) => item.id !== itemId));

      // Update query cache for tracked items
      queryClient.setQueryData(
        ["trackedItems", sessionId],
        (old: TrackedItem[] = []) => old.filter((item) => item.id !== itemId)
      );

      // Force inventory invalidation after deletion completes
      queryClient.invalidateQueries({
        queryKey: ["inventoryItems"],
        refetchType: "all",
      });

      toast({
        title: "Artículo eliminado",
        description: `${itemName || "Artículo"} ha sido eliminado y devuelto al inventario.`,
      });

      // Add a timeout to trigger another refresh after a short delay
      setTimeout(() => {
        // Refresh inventory data
        queryClient.invalidateQueries({
          queryKey: ["inventoryItems"],
          refetchType: "all",
        });

        // After delay, clear the updating flag so the add item button becomes enabled again
        setTimeout(() => {
          queryClient.setQueryData(["inventory-updating-state"], false);
        }, 500);
      }, 500);
    } catch (error) {
      console.error("Error removing tracked item:", error);

      // Show error toast
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to remove tracked item",
        variant: "destructive",
      });

      // Reset the inventory updating state
      queryClient.setQueryData(["inventory-updating-state"], false);

      // Refresh data in case of error
      fetchTrackedItems();

      // Also invalidate inventory items to get fresh data
      queryClient.invalidateQueries({
        queryKey: ["inventoryItems"],
        refetchType: "all",
      });
    } finally {
      setRemovingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  // React to query cache updates and invalidations
  useEffect(() => {
    // Initial fetch
    fetchTrackedItems();

    // Function to update local state from query cache
    const updateFromCache = () => {
      const cachedData = queryClient.getQueryData(["trackedItems", sessionId]);
      if (cachedData) {
        setTrackedItems(cachedData as TrackedItem[]);
        setIsLoading(false);
      }
    };

    // Subscribe to cache changes
    const unsubscribe = queryClient
      .getQueryCache()
      .subscribe((event: QueryCacheEvent) => {
        // When the query is invalidated
        if (
          event.type === "invalidated" &&
          Array.isArray(event.query?.queryKey) &&
          event.query?.queryKey[0] === "trackedItems" &&
          event.query?.queryKey[1] === sessionId
        ) {
          fetchTrackedItems();
        }
        // When the query data changes directly (optimistic updates)
        else if (
          event.type === "updated" &&
          Array.isArray(event.query?.queryKey) &&
          event.query?.queryKey[0] === "trackedItems" &&
          event.query?.queryKey[1] === sessionId
        ) {
          updateFromCache();
        }
      });

    return () => {
      unsubscribe();
    };
  }, [sessionId, fetchTrackedItems, queryClient]);

  // Calculate total cost of all tracked items
  const totalCost = trackedItems.reduce(
    (sum, item) => sum + item.quantity * Number(item.unitPrice),
    0
  );

  const content = (
    <>
      {showHeading && (
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center">
              <ClipboardList className="h-5 w-5 mr-2" />
              Artículos Registrados
              {isLoading && (
                <RefreshCw className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isLoading || isManualRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${isManualRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
          <CardDescription>
            Artículos consumidos durante esta sesión
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        {isLoading && trackedItems.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Cargando artículos registrados...</span>
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : trackedItems.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No hay artículos registrados para esta sesión.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artículo</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unitario</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackedItems.map((item) => (
                  <TableRow key={`item-${item.id}`}>
                    <TableCell className="font-medium">
                      {item.item?.name || "Artículo Desconocido"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(item.unitPrice).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${(item.quantity * Number(item.unitPrice)).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                        onClick={() =>
                          handleRemoveItem(item.id, item.item?.name || "")
                        }
                        disabled={removingItems[item.id]}
                      >
                        {removingItems[item.id] ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2">
                  <TableCell colSpan={3} className="font-bold text-right">
                    Total
                  </TableCell>
                  <TableCell className="font-bold text-right">
                    ${totalCost.toFixed(2)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="mt-4 text-sm text-muted-foreground">
              Estos artículos se incluirán en el pedido final cuando finalice la
              sesión.
            </div>
          </>
        )}
      </CardContent>
    </>
  );

  if (showCard) {
    return <Card>{content}</Card>;
  }

  return <div>{content}</div>;
}
