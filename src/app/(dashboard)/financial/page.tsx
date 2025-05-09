import { Metadata } from "next";
import { FinancialDashboard } from "@/components/financial/financial-dashboard";

export const metadata: Metadata = {
  title: "Financial Management",
  description: "Manage your business finances, track income, expenses, and generate reports",
};

export default function FinancialPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Financial Management</h2>
      </div>
      <FinancialDashboard />
    </div>
  );
} 