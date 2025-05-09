import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";

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

// Generic fetch function with error handling
async function apiFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'An error occurred');
  }
  
  return response.json();
}

export function useFinancial() {
  const { user } = useAuth();
  
  const queryResult = useQuery({
    queryKey: ['financial'],
    queryFn: () => apiFetch('/api/financial'),
    enabled: !!user, // Only fetch if user is logged in
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
  
  // Apply defensive programming patterns from section 7
  const safeData = queryResult.data?.data || null;
  
  return {
    data: safeData,
    loading: queryResult.isLoading,
    error: queryResult.error,
  };
} 