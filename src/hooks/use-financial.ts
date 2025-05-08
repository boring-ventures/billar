import { useState, useEffect } from "react";
import { useCurrentUser } from "./use-current-user";

interface FinancialData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  activeTables: number;
  incomeCategories: {
    id: string;
    name: string;
    total: number;
    percentage: number;
  }[];
  expenseCategories: {
    id: string;
    name: string;
    total: number;
    percentage: number;
  }[];
  recentIncome: {
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    status: string;
  }[];
  recentExpenses: {
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    status: string;
  }[];
}

export function useFinancial() {
  const { currentUser } = useCurrentUser();
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // For now, we'll use mock data since we're in testing with superadmin
        const mockData: FinancialData = {
          totalIncome: 45231.89,
          totalExpenses: 12234.56,
          netProfit: 32997.33,
          activeTables: 12,
          incomeCategories: [
            {
              id: "1",
              name: "Table Rent",
              total: 4500.00,
              percentage: 60,
            },
            {
              id: "2",
              name: "Food & Beverages",
              total: 2500.00,
              percentage: 33,
            },
            {
              id: "3",
              name: "Other Income",
              total: 500.00,
              percentage: 7,
            },
          ],
          expenseCategories: [
            {
              id: "1",
              name: "Inventory",
              total: 2500.00,
              percentage: 40,
            },
            {
              id: "2",
              name: "Maintenance",
              total: 1200.00,
              percentage: 20,
            },
            {
              id: "3",
              name: "Staff",
              total: 1500.00,
              percentage: 25,
            },
            {
              id: "4",
              name: "Utilities",
              total: 800.00,
              percentage: 15,
            },
          ],
          recentIncome: [
            {
              id: "1",
              date: "2024-03-15",
              category: "Table Rent",
              description: "Table 1 - 2 hours",
              amount: 150.00,
              status: "Completed",
            },
            {
              id: "2",
              date: "2024-03-15",
              category: "Food & Beverages",
              description: "Snacks and drinks",
              amount: 75.50,
              status: "Completed",
            },
          ],
          recentExpenses: [
            {
              id: "1",
              date: "2024-03-15",
              category: "Inventory",
              description: "Stock purchase - Snacks",
              amount: 250.00,
              status: "Paid",
            },
            {
              id: "2",
              date: "2024-03-14",
              category: "Maintenance",
              description: "Table repairs",
              amount: 120.00,
              status: "Paid",
            },
          ],
        };

        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch financial data'));
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  return {
    data,
    loading,
    error,
  };
} 