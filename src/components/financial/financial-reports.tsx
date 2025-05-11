"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { useFinancial } from "@/hooks/use-financial";
import { DateRange } from "react-day-picker";

interface Report {
  id: string;
  name: string;
  reportType: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
}

interface IncomeItem {
  id: string;
  date: string;
  amount: number;
  category?: string;
  source?: string;
}

export function FinancialReports() {
  // Use financial data from the API
  const { data, loading, error } = useFinancial();

  // Apply defensive programming patterns
  const safeData = data || {
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    activeTables: 0,
    incomeCategories: [],
    expenseCategories: [],
    recentIncome: [],
    recentExpenses: [],
  };

  // Default date range for report generation
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  const [reportType, setReportType] = useState("daily");

  // Mock reports - in a real implementation, this would come from a dedicated reports API endpoint
  // Using data from our existing API for now to show connected data
  const recentReports = safeData.recentIncome
    .slice(0, 3)
    .map((income: IncomeItem, index: number) => ({
      id: `report-${index + 1}`,
      name: `${index === 0 ? "Monthly" : index === 1 ? "Weekly" : "Daily"} Report - ${income.date}`,
      reportType: index === 0 ? "monthly" : index === 1 ? "weekly" : "daily",
      startDate: income.date,
      endDate: income.date,
      generatedAt: income.date,
    }));

  // Function to handle report generation
  const handleGenerateReport = () => {
    console.log("Generating report with:", {
      type: reportType,
      dateRange: date,
    });
    // In a real implementation, this would call an API endpoint to generate the report
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[100px] flex items-center justify-center">
              Loading...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    console.error("Error loading financial data:", error);
    return (
      <div className="p-4 text-red-500">
        Error loading financial data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Report</SelectItem>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="quarterly">Quarterly Report</SelectItem>
                  <SelectItem value="annual">Annual Report</SelectItem>
                  <SelectItem value="custom">Custom Period</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange date={date} setDate={setDate} />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={handleGenerateReport}>
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No recent reports available
            </div>
          ) : (
            <div className="space-y-4">
              {recentReports.map((report: Report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{report.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Generated on {report.generatedAt}
                    </p>
                  </div>
                  <Button variant="outline">Download</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
