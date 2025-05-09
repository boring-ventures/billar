import { Metadata } from "next";
import { FinancialReports } from "@/components/financial/financial-reports";

export const metadata: Metadata = {
  title: "Financial Reports",
  description: "Generate and view financial reports",
};

export default function FinancialReportsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
      </div>
      <FinancialReports />
    </div>
  );
} 