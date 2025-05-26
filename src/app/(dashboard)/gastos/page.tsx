import { Suspense } from "react";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ExpensesClient } from "@/components/expenses/expenses-client";
import { ExpensesSkeleton } from "@/components/expenses/expenses-skeleton";
import prisma from "@/lib/prisma";

export default async function GastosPage() {
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
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de Gastos
          </h1>
          <p className="text-muted-foreground">
            Administra y controla todos los gastos operativos de tu empresa
          </p>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <Suspense fallback={<ExpensesSkeleton />}>
          <ExpensesClient />
        </Suspense>
      </div>
    </div>
  );
}
