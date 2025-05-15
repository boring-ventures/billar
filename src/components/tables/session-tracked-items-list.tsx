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
import { ClipboardList, RefreshCw } from "lucide-react";

interface SessionTrackedItemsListProps {
  sessionId: string;
}

export function SessionTrackedItemsList({
  sessionId,
}: SessionTrackedItemsListProps) {
  const queryClient = useQueryClient();
  const [trackedItems, setTrackedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tracked items function that can be called when needed
  const fetchTrackedItems = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
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
    } catch (error) {
      console.error("Error fetching tracked items:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch tracked items"
      );
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, queryClient]);

  // React to query cache updates and invalidations
  useEffect(() => {
    // Initial fetch
    fetchTrackedItems();

    // Function to update local state from query cache
    const updateFromCache = () => {
      const cachedData = queryClient.getQueryData(["trackedItems", sessionId]);
      if (cachedData) {
        setTrackedItems(cachedData as any[]);
        setIsLoading(false);
      }
    };

    // Subscribe to cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // When the query is invalidated
      if (
        event.type === "invalidated" &&
        event.query.queryKey[0] === "trackedItems" &&
        event.query.queryKey[1] === sessionId
      ) {
        fetchTrackedItems();
      }
      // When the query data changes directly (optimistic updates)
      else if (
        event.type === "updated" &&
        event.query.queryKey[0] === "trackedItems" &&
        event.query.queryKey[1] === sessionId
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <ClipboardList className="h-5 w-5 mr-2" />
          Tracked Items
          {isLoading && (
            <RefreshCw className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
        <CardDescription>Items consumed during this session</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && trackedItems.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading tracked items...</span>
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : trackedItems.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No items have been tracked for this session.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackedItems.map((item) => (
                  <TableRow key={`item-${item.id}`}>
                    <TableCell className="font-medium">
                      {item.item?.name || "Unknown Item"}
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
                  </TableRow>
                ))}
                <TableRow className="border-t-2">
                  <TableCell colSpan={3} className="font-bold text-right">
                    Total
                  </TableCell>
                  <TableCell className="font-bold text-right">
                    ${totalCost.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="mt-4 text-sm text-muted-foreground">
              These items will be included in the final order when the session
              ends.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
