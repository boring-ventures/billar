import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import {
  parseOperatingDays,
  parseIndividualDayHours,
  type CompanyBusinessHours,
  getBusinessDayStart,
  getBusinessDayEnd,
} from "@/lib/utils";

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // Get session to check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the user's profile to check company access
    const userProfile = await prisma.profile.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        company: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const testDate =
      searchParams.get("date") || new Date().toISOString().split("T")[0]; // Default to today

    // Get company for business hours configuration
    const company = await prisma.company.findUnique({
      where: { id: userProfile.companyId! },
      select: {
        businessHoursStart: true,
        businessHoursEnd: true,
        timezone: true,
        operatingDays: true,
        individualDayHours: true,
        useIndividualHours: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Set up business configuration
    let businessConfig: CompanyBusinessHours | undefined;

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
          operatingDays: parseOperatingDays(company.operatingDays || undefined),
        },
      };
    }

    // Test the business day calculation
    const selectedDate = new Date(testDate);
    const businessDayStart = businessConfig
      ? getBusinessDayStart(selectedDate, businessConfig)
      : null;
    const businessDayEnd = businessConfig
      ? getBusinessDayEnd(selectedDate, businessConfig)
      : null;

    // Get some recent orders for context
    const recentOrders = await prisma.posOrder.findMany({
      where: {
        companyId: userProfile.companyId!,
        paymentStatus: "PAID",
        createdAt: {
          gte: new Date(new Date(testDate).getTime() - 48 * 60 * 60 * 1000), // 48 hours before
          lte: new Date(new Date(testDate).getTime() + 48 * 60 * 60 * 1000), // 48 hours after
        },
      },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        tableSessionId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      testDate,
      company: {
        businessHoursStart: company.businessHoursStart,
        businessHoursEnd: company.businessHoursEnd,
        useIndividualHours: company.useIndividualHours,
        individualDayHours: company.individualDayHours,
        timezone: company.timezone,
        operatingDays: company.operatingDays,
      },
      parsedBusinessConfig: businessConfig,
      calculatedBusinessDay: businessConfig
        ? {
            start: businessDayStart?.toISOString(),
            end: businessDayEnd?.toISOString(),
            spansMultipleDays:
              businessDayEnd &&
              businessDayStart &&
              businessDayEnd.getDate() !== businessDayStart.getDate(),
            durationHours:
              businessDayEnd && businessDayStart
                ? (businessDayEnd.getTime() - businessDayStart.getTime()) /
                  (1000 * 60 * 60)
                : null,
          }
        : null,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        amount: order.amount,
        createdAt: order.createdAt.toISOString(),
        tableSessionId: order.tableSessionId,
        isWithinBusinessHours:
          businessDayStart &&
          businessDayEnd &&
          order.createdAt >= businessDayStart &&
          order.createdAt <= businessDayEnd,
      })),
    });
  } catch (error) {
    console.error("Error in business hours debug:", error);
    return NextResponse.json(
      { error: "Failed to debug business hours" },
      { status: 500 }
    );
  }
}
