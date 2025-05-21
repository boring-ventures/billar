import { Suspense } from "react";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FinancialReportClient } from "@/components/reports/financial-report-client";
import { FinancialReportSkeleton } from "@/components/reports/financial-report-skeleton";
import prisma from "@/lib/prisma";

export default async function FinancialReportPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Fetch user profile to check role
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { role: true },
  });

  // Redirect sellers to dashboard
  if (profile?.role === "SELLER") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Reportes Financieros
        </h1>
      </div>
      <div className="rounded-lg border bg-card p-0">
        <Suspense fallback={<FinancialReportSkeleton />}>
          <FinancialReportClient />
        </Suspense>
      </div>
    </div>
  );
}
