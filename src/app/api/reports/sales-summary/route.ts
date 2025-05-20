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

    // Get start date (n days ago)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1); // +1 to include today
    startDate.setHours(0, 0, 0, 0);

    // Get end date (today at 23:59:59)
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Get all days between start and end date
    const dateRange: DateRangeItem[] = [];
    for (let i = 0; i < days; i++) {
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
