import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

export interface Expense {
  id: string;
  companyId: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface CreateExpenseData {
  companyId?: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  notes?: string;
}

export interface UpdateExpenseData extends CreateExpenseData {
  id: string;
}

interface UseExpensesProps {
  companyId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

export function useExpenses({
  companyId,
  category,
  startDate,
  endDate,
  enabled = true,
}: UseExpensesProps = {}) {
  const queryEnabled = enabled && !!companyId;

  return useQuery({
    queryKey: ["expenses", companyId, category, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (companyId) params.append("companyId", companyId);
      if (category) params.append("category", category);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/expenses?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }
      return response.json() as Promise<Expense[]>;
    },
    enabled: queryEnabled,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateExpenseData) => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Server error response:", error);
        console.error("Response status:", response.status);
        console.error("Request data:", data);
        throw new Error(
          error.error || error.message || "Failed to create expense"
        );
      }

      return response.json() as Promise<Expense>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({
        title: "Éxito",
        description: "Gasto creado exitosamente",
      });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateExpenseData) => {
      const { id, ...updateData } = data;
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update expense");
      }

      return response.json() as Promise<Expense>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({
        title: "Éxito",
        description: "Gasto actualizado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete expense");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({
        title: "Éxito",
        description: "Gasto eliminado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
