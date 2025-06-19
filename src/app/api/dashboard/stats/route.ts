import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import {
  getCurrentBusinessDay,
  parseOperatingDays,
  parseIndividualDayHours,
  type CompanyBusinessHours,
} from "@/lib/utils";

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
      (userProfile.companyId !== companyId && userProfile.role !== "SUPERADMIN")
    ) {
      return NextResponse.json(
        { error: "Unauthorized access to company data" },
        { status: 403 }
      );
    }

    // Get company for business hours configuration
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        businessHoursStart: true,
        businessHoursEnd: true,
        timezone: true,
        operatingDays: true,
        individualDayHours: true,
        useIndividualHours: true,
      },
    });

    // Set up business configuration
    let businessConfig: CompanyBusinessHours | undefined;

    if (company) {
      if (company.useIndividualHours && company.individualDayHours) {
        // Use individual day hours
        businessConfig = {
          useIndividualHours: true,
          individualHours: parseIndividualDayHours(company.individualDayHours),
        };
      } else if (company.businessHoursStart && company.businessHoursEnd) {
        // Use general business hours
        businessConfig = {
          useIndividualHours: false,
          generalHours: {
            start: company.businessHoursStart,
            end: company.businessHoursEnd,
            timezone: company.timezone || undefined,
            operatingDays: parseOperatingDays(
              company.operatingDays || undefined
            ),
          },
        };
      }
    }

    console.log("Business Configuration:", {
      useIndividual: company?.useIndividualHours,
      hasIndividualHours: !!company?.individualDayHours,
      hasGeneralHours: !!(
        company?.businessHoursStart && company?.businessHoursEnd
      ),
      config: businessConfig,
    });

    // Calculate "today" based on business configuration
    const { start: businessDayStart, end: businessDayEnd } =
      getCurrentBusinessDay(businessConfig);

    console.log("Business Day Boundaries:", {
      start: businessDayStart.toISOString(),
      end: businessDayEnd.toISOString(),
      timezone: company?.timezone || "default",
    });

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

    // Today's sales - filter by creation date within business day boundaries
    const todayPOSSales = await prisma.posOrder.aggregate({
      where: {
        companyId,
        createdAt: {
          gte: businessDayStart,
          lte: businessDayEnd,
        },
        paymentStatus: "PAID",
      },
      _sum: { amount: true },
    });

    // Today's table rental income
    const todayTableIncome = await prisma.tableSession.aggregate({
      where: {
        table: { companyId },
        endedAt: {
          not: null,
          gte: businessDayStart,
          lte: businessDayEnd,
        },
        status: "COMPLETED",
      },
      _sum: { totalCost: true },
    });

    // Calculate total today's sales (POS + Table rentals)
    const todaySales =
      Number(todayPOSSales._sum.amount || 0) +
      Number(todayTableIncome._sum.totalCost || 0);

    // Count today's orders
    const todayOrdersCount = await prisma.posOrder.count({
      where: {
        companyId,
        createdAt: {
          gte: businessDayStart,
          lte: businessDayEnd,
        },
      },
    });

    // Helper functions for calendar month boundaries
    const getStartOfMonth = () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    };

    const getEndOfMonth = () => {
      const now = new Date();
      return new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
    };

    // Get total revenue this month using calendar month boundaries
    const startOfMonth = getStartOfMonth();
    const endOfMonth = getEndOfMonth();

    // POS sales for this month
    const monthPOSSales = await prisma.posOrder.aggregate({
      where: {
        companyId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        paymentStatus: "PAID",
      },
      _sum: { amount: true },
    });

    // Table rental income for this month
    const monthTableIncome = await prisma.tableSession.aggregate({
      where: {
        table: { companyId },
        endedAt: {
          not: null,
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: "COMPLETED",
      },
      _sum: { totalCost: true },
    });

    // Calculate total monthly sales (POS + Table rentals)
    const monthSales =
      Number(monthPOSSales._sum.amount || 0) +
      Number(monthTableIncome._sum.totalCost || 0);

    // Count this month's orders
    const monthOrdersCount = await prisma.posOrder.count({
      where: {
        companyId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Additional debug logging for results
    console.log("Dashboard Stats Results:", {
      companyId,
      todayPOSSales: Number(todayPOSSales._sum.amount || 0),
      todayTableIncome: Number(todayTableIncome._sum.totalCost || 0),
      todaySales,
      todayOrdersCount,
      monthPOSSales: Number(monthPOSSales._sum.amount || 0),
      monthTableIncome: Number(monthTableIncome._sum.totalCost || 0),
      monthSales,
      monthOrdersCount,
      dateRanges: {
        businessDay: {
          from: businessDayStart.toISOString(),
          to: businessDayEnd.toISOString(),
        },
        month: {
          from: startOfMonth.toISOString(),
          to: endOfMonth.toISOString(),
        },
      },
    });

    // Return all stats together
    return NextResponse.json({
      tablesCount,
      activeSessionsCount,
      inventoryItemsCount,
      lowStockItemsCount,
      todaySales,
      monthSales,
      todayOrdersCount,
      monthOrdersCount,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
