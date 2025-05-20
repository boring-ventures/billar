import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ReportDetailClient } from "@/components/reports/report-detail-client";
import { ReportDetailSkeleton } from "@/components/reports/report-detail-skeleton";
import { Decimal } from "decimal.js";

// Helper function to convert Decimal objects to strings
const serializeReport = (report: any) => {
  if (!report) return null;

  // Create a new object with all properties serialized
  return {
    ...report,
    // Convert all decimal fields to strings
    salesIncome: report.salesIncome.toString(),
    tableRentIncome: report.tableRentIncome.toString(),
    otherIncome: report.otherIncome.toString(),
    totalIncome: report.totalIncome.toString(),
    inventoryCost: report.inventoryCost.toString(),
    maintenanceCost: report.maintenanceCost.toString(),
    staffCost: report.staffCost.toString(),
    utilityCost: report.utilityCost.toString(),
    otherExpenses: report.otherExpenses.toString(),
    totalExpense: report.totalExpense.toString(),
    netProfit: report.netProfit.toString(),
    // Convert dates to ISO strings if needed
    startDate: report.startDate.toISOString(),
    endDate: report.endDate.toISOString(),
    generatedAt: report.generatedAt.toISOString(),
  };
};

export default async function ReportDetailPage({
  params,
}: {
  params: { reportId: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Fetch the report data
  try {
    const report = await prisma.financialReport.findUnique({
      where: {
        id: params.reportId,
      },
      include: {
        company: true,
        generatedBy: true,
      },
    });

    if (!report) {
      notFound();
    }

    // Serialize the report to handle Decimal objects
    const serializedReport = serializeReport(report);

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            Detalle del Reporte
          </h1>
        </div>
        <div className="rounded-lg border bg-card">
          <Suspense fallback={<ReportDetailSkeleton />}>
            <ReportDetailClient report={serializedReport} />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching report:", error);
    return (
      <div className="p-6">
        <div className="rounded-lg border bg-destructive/10 p-4 text-destructive">
          Error al cargar el reporte. Por favor, inténtalo de nuevo.
        </div>
      </div>
    );
  }
}
