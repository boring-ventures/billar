import { useState, useEffect } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
}

interface Table {
  id: string;
  number: string;
  status: "available" | "occupied" | "reserved";
  hourlyRate: number;
  durationInHours?: number;
  endSession?: boolean;
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

// Mock data for testing
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Beer",
    price: 5.99,
    category: "Drinks",
  },
  {
    id: "2",
    name: "Wine",
    price: 8.99,
    category: "Drinks",
  },
  {
    id: "3",
    name: "Cocktail",
    price: 12.99,
    category: "Drinks",
  },
  {
    id: "4",
    name: "Snacks",
    price: 4.99,
    category: "Food",
  },
];

const mockTables: Table[] = [
  {
    id: "1",
    number: "1",
    status: "available",
    hourlyRate: 10.00,
  },
  {
    id: "2",
    number: "2",
    status: "available",
    hourlyRate: 15.00,
  },
  {
    id: "3",
    number: "3",
    status: "occupied",
    hourlyRate: 20.00,
    currentSession: {
      id: "session1",
      startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      orderCount: 2,
    },
  },
];

export function usePOS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionTimers, setSessionTimers] = useState<{ [key: string]: NodeJS.Timeout }>({});

  // Initialize with mock data
  useEffect(() => {
    setLoading(true);
    try {
      setProducts(mockProducts);
      setTables(mockTables);
    } catch (err) {
      setError("Failed to initialize POS data");
    }
    setLoading(false);
  }, []);

  // Update session costs every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTables((prev) =>
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
      const startTime = new Date();
      const endTime = durationInHours
        ? new Date(startTime.getTime() + durationInHours * 3600000)
        : undefined;

      const newSession = {
        id: `session-${Date.now()}`,
        startTime: startTime.toISOString(),
        endTime: endTime?.toISOString(),
        orderCount: 0,
        totalTime: 0,
        totalCost: 0,
      };

      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? { ...table, status: "occupied", currentSession: newSession }
            : table
        )
      );

      // If there's a duration, set up a timer to end the session
      if (durationInHours) {
        const timer = setTimeout(() => {
          endTableSession(tableId);
        }, durationInHours * 3600000);

        setSessionTimers((prev) => ({
          ...prev,
          [tableId]: timer,
        }));
      }
    } catch (err) {
      setError("Failed to start table session");
    }
  };

  // End a table session
  const endTableSession = (tableId: string) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.id === tableId) {
          // Calculate final cost if there's an active session
          let finalCost = 0;
          if (table.currentSession) {
            const startTime = new Date(table.currentSession.startTime).getTime();
            const endTime = Date.now();
            const minutesPassed = Math.floor((endTime - startTime) / (1000 * 60));
            finalCost = (minutesPassed / 60) * table.hourlyRate;
          }

          // Return a completely new table object with session cleared
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

  // Complete order
  const completeOrder = async () => {
    if (!currentOrder.length) return;

    try {
      setCurrentOrder([]);
      if (selectedTable) {
        setTables((prev) =>
          prev.map((table) =>
            table.id === selectedTable.id
              ? {
                  ...table,
                  currentSession: {
                    ...table.currentSession!,
                    orderCount: (table.currentSession?.orderCount || 0) + 1,
                  },
                }
              : table
          )
        );
      }
    } catch (err) {
      setError("Failed to complete order");
    }
  };

  // Handle table selection
  const handleTableSelect = (table: Table) => {
    if (table.endSession) {
      endTableSession(table.id);
      setSelectedTable(null); // Clear selected table when ending session
    } else if (table.durationInHours) {
      startTableSession(table.id, table.durationInHours);
    } else {
      setSelectedTable(table);
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
    handleTableSelect,
  };
} 