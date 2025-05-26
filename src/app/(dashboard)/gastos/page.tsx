import { Suspense } from "react";
import { ExpensesClient } from "@/components/expenses/expenses-client";
import { ExpensesSkeleton } from "@/components/expenses/expenses-skeleton";

export default function GastosPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
          <p className="text-muted-foreground">
            Gestiona los gastos operativos de tu empresa
          </p>
        </div>

        <Suspense fallback={<ExpensesSkeleton />}>
          <ExpensesClient />
        </Suspense>
      </div>
    </div>
  );
}
