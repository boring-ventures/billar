import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if user is authorized to access this company's data
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (
      !userProfile ||
      (userProfile.companyId !== companyId && userProfile.role !== "ADMIN")
    ) {
      return NextResponse.json(
        { error: "Unauthorized access to company data" },
        { status: 403 }
      );
    }

    // Get tables stats
    const tablesCount = await prisma.table.count({
      where: { companyId },
    });

    const activeSessionsCount = await prisma.tableSession.count({
      where: {
        table: { companyId },
        status: "ACTIVE",
      },
    });

    // Get inventory stats
    const inventoryItemsCount = await prisma.inventoryItem.count({
      where: { companyId },
    });

    const lowStockItemsCount = await prisma.inventoryItem.count({
      where: {
        companyId,
        quantity: { lte: prisma.inventoryItem.fields.criticalThreshold },
      },
    });

    // Calculate total sales for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = await prisma.posOrder.aggregate({
      where: {
        companyId,
        createdAt: { gte: today },
        paymentStatus: "PAID",
      },
      _sum: { amount: true },
    });

    // Get total revenue this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const monthSales = await prisma.posOrder.aggregate({
      where: {
        companyId,
        createdAt: { gte: firstDayOfMonth },
        paymentStatus: "PAID",
      },
      _sum: { amount: true },
    });

    // Return all stats together
    return NextResponse.json({
      tablesCount,
      activeSessionsCount,
      inventoryItemsCount,
      lowStockItemsCount,
      todaySales: Number(todaySales._sum.amount || 0),
      monthSales: Number(monthSales._sum.amount || 0),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
