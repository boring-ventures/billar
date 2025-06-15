import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import {
  getStartOfDay,
  getEndOfDay,
  getStartOfMonth,
  getEndOfMonth,
  getCurrentBusinessDay,
  parseOperatingDays,
  type BusinessHours,
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
            operatingDays: parseOperatingDays(company.operatingDays),
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
    const todaySales = await prisma.posOrder.aggregate({
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

    // Get total revenue this month using calendar month boundaries
    const startOfMonth = getStartOfMonth();
    const endOfMonth = getEndOfMonth();

    const monthSales = await prisma.posOrder.aggregate({
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
      todaySales: Number(todaySales._sum.amount || 0),
      todayOrdersCount,
      monthSales: Number(monthSales._sum.amount || 0),
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
      todaySales: Number(todaySales._sum.amount || 0),
      monthSales: Number(monthSales._sum.amount || 0),
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
