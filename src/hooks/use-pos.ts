import { useState, useEffect } from "react";
import { useApiQuery } from "./use-api";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  sku?: string;
  quantity?: number;
  companyId?: string;
  companyName?: string;
}

interface Table {
  id: string;
  number: string;
  status: "available" | "occupied" | "reserved";
  hourlyRate: number;
  durationInHours?: number;
  endSession?: boolean;
  companyId?: string;
  companyName?: string;
  currentSession?: {
    id: string;
    startTime: string;
    endTime?: string;
    orderCount: number;
    totalTime?: number;
    totalCost?: number;
  };
}

interface OrderItem {
  product: Product;
  quantity: number;
  notes?: string;
}

// Use real API instead of mock data
export function usePOS() {
  // Maintain local state for mutations
  const [localTables, setLocalTables] = useState<Table[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionTimers, setSessionTimers] = useState<{ [key: string]: NodeJS.Timeout }>({});

  // Use our new API hooks for data fetching
  const { 
    data: inventoryData,
    isLoading: isLoadingInventory,
    error: inventoryError
  } = useApiQuery<{ data: Product[] }>(['posInventory'], '/api/pos/inventory');

  const {
    data: tablesData,
    isLoading: isLoadingTables,
    error: tablesError,
    refetch: refetchTables
  } = useApiQuery<{ data: Table[] }>(['posTables'], '/api/pos/tables');

  // Extract products from the response data
  const products = inventoryData?.data || [];
  
  // Update local tables when API data changes
  useEffect(() => {
    if (tablesData?.data) {
      setLocalTables(tablesData.data);
    }
  }, [tablesData]);
  
  // Use local tables for UI
  const tables = localTables;
  
  // Combine loading states
  const loading = isLoadingInventory || isLoadingTables;
  
  // Handle errors from API calls
  useEffect(() => {
    if (inventoryError) {
      setError("Failed to fetch inventory: " + (inventoryError as Error).message);
    } else if (tablesError) {
      setError("Failed to fetch tables: " + (tablesError as Error).message);
    } else {
      setError(null);
    }
  }, [inventoryError, tablesError]);

  // Update session costs every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTables((prev) =>
        prev.map((table) => {
          if (table.currentSession && !table.currentSession.endTime) {
            const startTime = new Date(table.currentSession.startTime).getTime();
            const now = Date.now();
            const minutesPassed = Math.floor((now - startTime) / (1000 * 60));
            const hourlyRate = table.hourlyRate;
            const cost = (minutesPassed / 60) * hourlyRate;

            return {
              ...table,
              currentSession: {
                ...table.currentSession,
                totalTime: minutesPassed,
                totalCost: cost,
              },
            };
          }
          return table;
        })
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Start a new table session
  const startTableSession = async (tableId: string, durationInHours?: number) => {
    try {
      // Call the API to start a new session
      const response = await fetch(`/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId,
          duration: durationInHours,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start table session');
      }

      const sessionData = await response.json();
      
      // Update local tables data
      setLocalTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? { 
                ...table, 
                status: "occupied", 
                currentSession: {
                  id: sessionData.id,
                  startTime: sessionData.startedAt,
                  endTime: sessionData.endedAt,
                  orderCount: 0,
                  totalTime: 0,
                  totalCost: 0,
                }
              }
            : table
        )
      );

      // If there's a duration, set up a timer to refresh tables
      if (durationInHours) {
        const timer = setTimeout(() => {
          // Refresh tables data after the session should have ended
          refetchTables();
        }, durationInHours * 3600000);

        setSessionTimers((prev) => ({
          ...prev,
          [tableId]: timer,
        }));
      }
    } catch (err) {
      console.error('Error starting session:', err);
      setError("Failed to start table session");
    }
  };

  // End a table session
  const endTableSession = async (tableId: string) => {
    try {
      // Find the session ID
      const table = tables.find(t => t.id === tableId);
      if (!table || !table.currentSession) {
        throw new Error("No active session found");
      }
      
      // Call the API to end the session
      const response = await fetch(`/api/sessions/${table.currentSession.id}/end`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to end table session');
      }
      
      // Update local tables data
      setLocalTables((prev) =>
        prev.map((table) => {
          if (table.id === tableId) {
            return {
              ...table,
              status: "available",
              currentSession: undefined,
              durationInHours: undefined,
              endSession: undefined,
            };
          }
          return table;
        })
      );

      // Clear the timer if it exists
      if (sessionTimers[tableId]) {
        clearTimeout(sessionTimers[tableId]);
        setSessionTimers((prev) => {
          const newTimers = { ...prev };
          delete newTimers[tableId];
          return newTimers;
        });
      }
    } catch (err) {
      console.error('Error ending session:', err);
      setError("Failed to end table session");
    }
  };

  // Add item to current order
  const addToOrder = (product: Product, quantity: number = 1) => {
    setCurrentOrder((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  // Remove item from current order
  const removeFromOrder = (productId: string) => {
    setCurrentOrder((prev) =>
      prev.filter((item) => item.product.id !== productId)
    );
  };

  // Update item quantity
  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromOrder(productId);
      return;
    }
    
    setCurrentOrder((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Calculate order total
  const calculateTotal = () => {
    return currentOrder.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  // Complete the current order
  const completeOrder = async () => {
    if (currentOrder.length === 0) return;

    try {
      // Call the API to create an order
      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId: selectedTable?.id,
          items: currentOrder.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            notes: item.notes,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete order');
      }

      // Clear the current order
      setCurrentOrder([]);

      // Update the selected table if needed
      if (selectedTable?.currentSession) {
        // Fetch updated table data
        refetchTables();
        
        // Find and update the selected table
        const updatedTable = tables.find(t => t.id === selectedTable.id);
        if (updatedTable) {
          setSelectedTable(updatedTable);
        }
      }
    } catch (err) {
      console.error('Error completing order:', err);
      setError("Failed to complete order");
    }
  };

  return {
    products,
    tables,
    currentOrder,
    selectedTable,
    loading,
    error,
    setSelectedTable,
    addToOrder,
    removeFromOrder,
    updateItemQuantity,
    calculateTotal,
    completeOrder,
    startTableSession,
    endTableSession,
  };
} 