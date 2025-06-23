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
      // Use business day logic for calculating date ranges
      if (businessConfig) {
        // For single day reports, use current business day
        if (days === 1) {
          const { start: businessDayStart, end: businessDayEnd } =
            getCurrentBusinessDay(businessConfig);
          startDate = businessDayStart;
          endDate = businessDayEnd;
        } else {
          // For multi-day reports, calculate business days backwards
          const currentBusinessDay = getCurrentBusinessDay(businessConfig);
          endDate = currentBusinessDay.end;

          // Calculate start date by going back 'days' business days
          startDate = new Date(currentBusinessDay.start);
          startDate.setDate(startDate.getDate() - (days - 1));

          // If we have individual hours, we need to find the start of that business day
          if (
            businessConfig.useIndividualHours &&
            businessConfig.individualHours
          ) {
            const startDayOfWeek = startDate
              .toLocaleDateString("en-US", { weekday: "short" })
              .toUpperCase();
            const startDayConfig =
              businessConfig.individualHours[startDayOfWeek];

            if (startDayConfig?.enabled) {
              const [startHour, startMinute] = startDayConfig.start
                .split(":")
                .map(Number);
              startDate.setHours(startHour, startMinute, 0, 0);
            } else {
              // If that day is not enabled, use midnight
              startDate.setHours(0, 0, 0, 0);
            }
          } else if (businessConfig.generalHours) {
            const [startHour, startMinute] = businessConfig.generalHours.start
              .split(":")
              .map(Number);
            startDate.setHours(startHour, startMinute, 0, 0);
          }
        }
      } else {
        // Fallback to calendar day logic if no business hours configured
        const now = new Date();

        if (days === 1) {
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);

          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - days + 1);
          startDate.setHours(0, 0, 0, 0);

          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
        }
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
      hasBusinessConfig: !!businessConfig,
      businessConfigType: businessConfig?.useIndividualHours
        ? "individual"
        : "general",
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

    // Get POS orders aggregated by date (only standalone orders, not linked to table sessions)
    const posOrders = await prisma.posOrder.findMany({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        paymentStatus: "PAID",
        tableSessionId: null, // Only standalone orders, not linked to table sessions
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    // Get table sessions aggregated by date (totalCost includes session rental + any linked POS orders)
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
      standalonePosOrdersCount: posOrders.length,
      tableSessionsCount: tableSessions.length,
      standalonePosOrdersTotal: posOrders.reduce(
        (sum, order) => sum + Number(order.amount || 0),
        0
      ),
      tableSessionsTotal: tableSessions.reduce(
        (sum, session) => sum + Number(session.totalCost || 0),
        0
      ),
      note: "Fixed double-counting: POS orders now only include standalone orders (not linked to table sessions).",
    });

    // Helper function to determine which business day an order/session belongs to
    const getBusinessDayForDate = (date: Date): Date => {
      if (!businessConfig) {
        // Fallback to calendar day
        const calendarDay = new Date(date);
        calendarDay.setHours(0, 0, 0, 0);
        return calendarDay;
      }

      // For business day logic, we need to check if this time falls within a business day
      // that might have started the previous calendar day

      if (businessConfig.useIndividualHours && businessConfig.individualHours) {
        // Check current day first
        const currentDayOfWeek = date
          .toLocaleDateString("en-US", { weekday: "short" })
          .toUpperCase();
        const currentDayConfig =
          businessConfig.individualHours[currentDayOfWeek];

        if (currentDayConfig?.enabled) {
          const [startHour, startMinute] = currentDayConfig.start
            .split(":")
            .map(Number);
          const [endHour, endMinute] = currentDayConfig.end
            .split(":")
            .map(Number);

          const startTime = new Date(date);
          startTime.setHours(startHour, startMinute, 0, 0);

          const endTime = new Date(date);
          if (endHour < startHour) {
            // Crosses midnight - end time is next day
            endTime.setDate(endTime.getDate() + 1);
          }
          endTime.setHours(endHour, endMinute, 59, 999);

          if (date >= startTime && date <= endTime) {
            // This date belongs to the current business day
            return new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate()
            );
          }
        }

        // Check if it belongs to the previous day's business hours
        const previousDay = new Date(date);
        previousDay.setDate(previousDay.getDate() - 1);
        const previousDayOfWeek = previousDay
          .toLocaleDateString("en-US", { weekday: "short" })
          .toUpperCase();
        const previousDayConfig =
          businessConfig.individualHours[previousDayOfWeek];

        if (previousDayConfig?.enabled) {
          const [startHour, startMinute] = previousDayConfig.start
            .split(":")
            .map(Number);
          const [endHour, endMinute] = previousDayConfig.end
            .split(":")
            .map(Number);

          if (endHour < startHour) {
            // Previous day crosses midnight
            const endTime = new Date(date);
            endTime.setHours(endHour, endMinute, 59, 999);

            const startTime = new Date(previousDay);
            startTime.setHours(startHour, startMinute, 0, 0);

            if (date <= endTime) {
              // This belongs to the previous business day
              return new Date(
                previousDay.getFullYear(),
                previousDay.getMonth(),
                previousDay.getDate()
              );
            }
          }
        }
      } else if (businessConfig.generalHours) {
        const { start, end, operatingDays } = businessConfig.generalHours;
        const [startHour, startMinute] = start.split(":").map(Number);
        const [endHour, endMinute] = end.split(":").map(Number);

        const currentDayOfWeek = date
          .toLocaleDateString("en-US", { weekday: "short" })
          .toUpperCase();

        // Check if current day is operating day
        if (!operatingDays || operatingDays.includes(currentDayOfWeek)) {
          const startTime = new Date(date);
          startTime.setHours(startHour, startMinute, 0, 0);

          const endTime = new Date(date);
          if (endHour < startHour) {
            // Crosses midnight
            endTime.setDate(endTime.getDate() + 1);
          }
          endTime.setHours(endHour, endMinute, 59, 999);

          if (date >= startTime && date <= endTime) {
            return new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate()
            );
          }
        }

        // Check previous day if it crosses midnight
        if (endHour < startHour) {
          const previousDay = new Date(date);
          previousDay.setDate(previousDay.getDate() - 1);
          const previousDayOfWeek = previousDay
            .toLocaleDateString("en-US", { weekday: "short" })
            .toUpperCase();

          if (!operatingDays || operatingDays.includes(previousDayOfWeek)) {
            const endTime = new Date(date);
            endTime.setHours(endHour, endMinute, 59, 999);

            if (date <= endTime) {
              return new Date(
                previousDay.getFullYear(),
                previousDay.getMonth(),
                previousDay.getDate()
              );
            }
          }
        }
      }

      // Fallback to calendar day if no match
      const calendarDay = new Date(date);
      calendarDay.setHours(0, 0, 0, 0);
      return calendarDay;
    };

    // Populate data into dateRange based on business day logic
    posOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const businessDay = getBusinessDayForDate(orderDate);

      const index = dateRange.findIndex(
        (d) =>
          d.year === businessDay.getFullYear() &&
          d.month === businessDay.getMonth() &&
          d.day === businessDay.getDate()
      );

      if (index !== -1 && order.amount) {
        dateRange[index].posAmount += Number(order.amount);
      }
    });

    tableSessions.forEach((session) => {
      if (!session.endedAt) return;

      const sessionDate = new Date(session.endedAt);
      const businessDay = getBusinessDayForDate(sessionDate);

      const index = dateRange.findIndex(
        (d) =>
          d.year === businessDay.getFullYear() &&
          d.month === businessDay.getMonth() &&
          d.day === businessDay.getDate()
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
