import { Metadata } from "next";
import { ExpensesTracking } from "@/components/financial/expenses-tracking";

export const metadata: Metadata = {
  title: "Expenses Tracking",
  description: "Track and manage your business expenses",
};

export default function ExpensesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Expenses Tracking</h2>
      </div>
      <ExpensesTracking />
    </div>
  );
} 