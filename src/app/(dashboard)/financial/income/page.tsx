import { Metadata } from "next";
import { IncomeTracking } from "@/components/financial/income-tracking";

export const metadata: Metadata = {
  title: "Income Tracking",
  description: "Track and manage your business income",
};

export default function IncomePage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Income Tracking</h2>
      </div>
      <IncomeTracking />
    </div>
  );
} 