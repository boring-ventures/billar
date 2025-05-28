import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Define interface for date range items
interface DateRangeItem {
  date: string;
  year: number;
  month: number;
  day: number;
  posAmount: number;
  tableAmount: number;
}

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
    const days = searchParams.has("days")
      ? parseInt(searchParams.get("days")!)
      : 7;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

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

    if (!userProfile || userProfile.companyId !== companyId) {
      return NextResponse.json(
        { error: "Unauthorized access to company data" },
        { status: 403 }
      );
    }

    let startDate: Date;
    let endDate: Date;

    // If specific dates are provided, use them
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(endDateParam);
      // If it's the same day or end date doesn't have time, set to end of day
      if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
        endDate.setHours(23, 59, 59, 999);
      }
    } else {
      // Use the existing "days ago" logic
      const now = new Date();

      // For single day reports, use today's date range
      if (days === 1) {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // For multi-day reports
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    // Calculate the number of days in the range
    const daysDiff =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    // Debug logging
    console.log("Sales Summary Debug:", {
      companyId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      daysDiff,
      startDateParam,
      endDateParam,
      days,
    });

    // Get all days between start and end date
    const dateRange: DateRangeItem[] = [];
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const formattedDate = new Intl.DateTimeFormat("es-ES", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      }).format(date);

      dateRange.push({
        date: formattedDate,
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
        posAmount: 0,
        tableAmount: 0,
      });
    }

    // Get POS orders aggregated by date
    const posOrders = await prisma.posOrder.findMany({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        paymentStatus: "PAID",
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    // Get table sessions aggregated by date
    const tableSessions = await prisma.tableSession.findMany({
      where: {
        table: {
          companyId,
        },
        endedAt: {
          not: null,
          gte: startDate,
          lte: endDate,
        },
        status: "COMPLETED",
      },
      select: {
        totalCost: true,
        endedAt: true,
      },
    });

    // Debug logging for retrieved data
    console.log("Retrieved data:", {
      posOrdersCount: posOrders.length,
      tableSessionsCount: tableSessions.length,
      posOrdersTotal: posOrders.reduce(
        (sum, order) => sum + Number(order.amount || 0),
        0
      ),
      tableSessionsTotal: tableSessions.reduce(
        (sum, session) => sum + Number(session.totalCost || 0),
        0
      ),
    });

    // Populate data into dateRange
    posOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const index = dateRange.findIndex(
        (d) =>
          d.year === orderDate.getFullYear() &&
          d.month === orderDate.getMonth() &&
          d.day === orderDate.getDate()
      );

      if (index !== -1 && order.amount) {
        dateRange[index].posAmount += Number(order.amount);
      }
    });

    tableSessions.forEach((session) => {
      if (!session.endedAt) return;

      const sessionDate = new Date(session.endedAt);
      const index = dateRange.findIndex(
        (d) =>
          d.year === sessionDate.getFullYear() &&
          d.month === sessionDate.getMonth() &&
          d.day === sessionDate.getDate()
      );

      if (index !== -1 && session.totalCost) {
        dateRange[index].tableAmount += Number(session.totalCost);
      }
    });

    // Return the chart data (removing the date components used for filtering)
    const chartData = dateRange.map(({ date, posAmount, tableAmount }) => ({
      date,
      posAmount,
      tableAmount,
    }));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales summary" },
      { status: 500 }
    );
  }
}
