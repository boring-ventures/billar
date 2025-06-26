import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Decimal } from "decimal.js";
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

    // Block sellers from accessing reports
    if (userProfile.role === "SELLER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");
    const reportType = searchParams.get("reportType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate required parameters
    if (!companyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters: companyId, startDate, endDate" },
        { status: 400 }
      );
    }

    // For non-superadmin users, enforce their company ID
    if (userProfile.role !== "SUPERADMIN") {
      // If the requested company is not the user's company, return an error
      if (userProfile.companyId !== companyId) {
        return NextResponse.json(
          {
            error: "Access denied: You can only view reports for your company",
          },
          { status: 403 }
        );
      }
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

    let parsedStartDate: Date;
    let parsedEndDate: Date;
    let expenseStartDate: Date;
    let expenseEndDate: Date;

    // Handle daily reports with business day logic for INCOMES only
    if (reportType === "DAILY" && businessConfig) {
      // Use the selected date, not today
      const selectedDate = new Date(startDate);
      const businessDayStart = getBusinessDayStart(
        selectedDate,
        businessConfig
      );
      const businessDayEnd = getBusinessDayEnd(selectedDate, businessConfig);

      // Business hours for income calculations (POS orders and table sessions)
      parsedStartDate = businessDayStart;
      parsedEndDate = businessDayEnd;

      // Full calendar day for expense calculations (stock movements, maintenance, expenses)
      expenseStartDate = new Date(selectedDate);
      expenseStartDate.setHours(0, 0, 0, 0);
      expenseEndDate = new Date(selectedDate);
      expenseEndDate.setHours(23, 59, 59, 999);
    } else {
      // For custom reports or when no business config, use provided dates for both
      parsedStartDate = new Date(startDate);
      parsedEndDate = new Date(endDate);

      // If custom report, dates already include time from frontend
      // If it's the same day or end date doesn't have time, set to end of day
      if (reportType === "DAILY") {
        parsedStartDate.setHours(0, 0, 0, 0);
        if (
          parsedEndDate.getHours() === 0 &&
          parsedEndDate.getMinutes() === 0
        ) {
          parsedEndDate.setHours(23, 59, 59, 999);
        }
      }

      // Use same dates for expenses
      expenseStartDate = parsedStartDate;
      expenseEndDate = parsedEndDate;
    }

    // Calculate report name based on type and date range
    let reportName = "";
    switch (reportType) {
      case "DAILY":
        if (businessConfig) {
          reportName = `Reporte Diario de Negocio ${parsedStartDate.toLocaleDateString()}`;
        } else {
          reportName = `Reporte Diario ${parsedStartDate.toLocaleDateString()}`;
        }
        break;
      case "CUSTOM":
        reportName = `Reporte Personalizado ${parsedStartDate.toLocaleDateString()} - ${parsedEndDate.toLocaleDateString()}`;
        break;
      default:
        reportName = `Reporte Personalizado ${parsedStartDate.toLocaleDateString()} - ${parsedEndDate.toLocaleDateString()}`;
    }

    console.log("Financial Report Debug:", {
      companyId,
      reportType,
      originalStart: startDate,
      originalEnd: endDate,
      parsedStartDate: parsedStartDate.toISOString(),
      parsedEndDate: parsedEndDate.toISOString(),
      hasBusinessConfig: !!businessConfig,
      businessConfigType: businessConfig?.useIndividualHours
        ? "individual"
        : "general",
    });

    // First, let's check if there are any POS orders for this company at all
    const totalOrdersCount = await prisma.posOrder.count({
      where: {
        companyId,
        paymentStatus: "PAID",
      },
    });

    console.log("Data Availability Debug:", {
      companyId,
      totalPaidOrders: totalOrdersCount,
      queryDateRange: {
        from: parsedStartDate.toISOString(),
        to: parsedEndDate.toISOString(),
      },
    });

    // Calculate financial data from POS orders (sales income)
    // Include ALL POS orders, both standalone and linked to table sessions
    // Use business hours for income data
    const posOrders = await prisma.posOrder.findMany({
      where: {
        companyId,
        createdAt: {
          gte: parsedStartDate,
          lte: parsedEndDate,
        },
        paymentStatus: "PAID",
        // Remove the tableSessionId: null filter to include ALL POS orders
      },
      include: {
        orderItems: true,
      },
    });

    console.log("POS Orders Debug:", {
      companyId,
      incomeDateRange: {
        from: parsedStartDate.toISOString(),
        to: parsedEndDate.toISOString(),
      },
      expenseDateRange: {
        from: expenseStartDate.toISOString(),
        to: expenseEndDate.toISOString(),
      },
      foundAllOrders: posOrders.length,
      standalonOrdersCount: posOrders.filter((order) => !order.tableSessionId)
        .length,
      sessionLinkedOrdersCount: posOrders.filter(
        (order) => !!order.tableSessionId
      ).length,
      orderSamples: posOrders.slice(0, 3).map((order) => ({
        id: order.id,
        amount: order.amount,
        createdAt: order.createdAt.toISOString(),
        paymentStatus: order.paymentStatus,
        tableSessionId: order.tableSessionId,
      })),
      note: "Now including ALL POS orders (both standalone and session-linked) in sales income. Table rent income remains pure table rental cost.",
    });

    // Calculate sales income from ALL POS orders (both standalone and session-linked)
    const salesIncome = posOrders.reduce((total, order) => {
      return total.plus(order.amount || 0);
    }, new Decimal(0));

    // Calculate table rent income from table sessions (includes session rental + any linked POS orders)
    // Use business hours for income data
    const tableSessions = await prisma.tableSession.findMany({
      where: {
        startedAt: {
          gte: parsedStartDate,
          lte: parsedEndDate,
        },
        endedAt: {
          not: null,
        },
        status: "COMPLETED",
        table: {
          companyId,
        },
      },
    });

    console.log("Table Sessions Debug:", {
      companyId,
      incomeDateRange: {
        from: parsedStartDate.toISOString(),
        to: parsedEndDate.toISOString(),
      },
      foundSessions: tableSessions.length,
      sessionSamples: tableSessions.slice(0, 3).map((session) => ({
        id: session.id,
        totalCost: session.totalCost,
        startedAt: session.startedAt.toISOString(),
        endedAt: session.endedAt?.toISOString(),
        status: session.status,
      })),
      note: "Table session totalCost includes session rental + any linked POS orders. Using business hours for income data.",
    });

    const tableRentIncome = tableSessions.reduce((total, session) => {
      return total.plus(session.totalCost || 0);
    }, new Decimal(0));

    // Calculate inventory costs (purchases) - separate by item type
    // Use full calendar day for expense data
    const stockMovements = await prisma.stockMovement.findMany({
      where: {
        createdAt: {
          gte: expenseStartDate,
          lte: expenseEndDate,
        },
        type: "PURCHASE",
        item: {
          companyId,
        },
      },
      include: {
        item: {
          select: {
            itemType: true,
          },
        },
      },
    });

    // Separate costs by item type
    const saleItemsCost = stockMovements.reduce((total, movement) => {
      if (movement.item?.itemType === "SALE") {
        const costPerItem = movement.costPrice || new Decimal(0);
        const quantity = movement.quantity;
        return total.plus(costPerItem.mul(quantity));
      }
      return total;
    }, new Decimal(0));

    const internalUseCost = stockMovements.reduce((total, movement) => {
      if (movement.item?.itemType === "INTERNAL_USE") {
        const costPerItem = movement.costPrice || new Decimal(0);
        const quantity = movement.quantity;
        return total.plus(costPerItem.mul(quantity));
      }
      return total;
    }, new Decimal(0));

    // For backward compatibility, inventoryCost represents sale items cost
    const inventoryCost = saleItemsCost;

    // Calculate maintenance costs
    // Use full calendar day for expense data
    const maintenances = await prisma.tableMaintenance.findMany({
      where: {
        maintenanceAt: {
          gte: expenseStartDate,
          lte: expenseEndDate,
        },
        table: {
          companyId,
        },
      },
    });

    const maintenanceCost = maintenances.reduce((total, maintenance) => {
      return total.plus(maintenance.cost || 0);
    }, new Decimal(0));

    // Calculate expenses from the new Expense model
    // Use full calendar day for expense data
    const expenses = await prisma.expense.findMany({
      where: {
        companyId,
        expenseDate: {
          gte: expenseStartDate,
          lte: expenseEndDate,
        },
      },
    });

    // Separate expenses by category
    const staffCost = expenses.reduce((total, expense) => {
      if (expense.category === "STAFF") {
        return total.plus(expense.amount);
      }
      return total;
    }, new Decimal(0));

    const utilityCost = expenses.reduce((total, expense) => {
      if (expense.category === "UTILITIES") {
        return total.plus(expense.amount);
      }
      return total;
    }, new Decimal(0));

    // Additional maintenance costs from expenses (separate from table maintenance)
    const additionalMaintenanceCost = expenses.reduce((total, expense) => {
      if (expense.category === "MAINTENANCE") {
        return total.plus(expense.amount);
      }
      return total;
    }, new Decimal(0));

    // Combine table maintenance with additional maintenance expenses
    const totalMaintenanceCost = maintenanceCost.plus(
      additionalMaintenanceCost
    );

    // Other expenses (supplies, rent, insurance, marketing, other)
    const additionalExpenses = expenses.reduce((total, expense) => {
      if (
        ["SUPPLIES", "RENT", "INSURANCE", "MARKETING", "OTHER"].includes(
          expense.category
        )
      ) {
        return total.plus(expense.amount);
      }
      return total;
    }, new Decimal(0));

    // Other static values for now (could be expanded later)
    const otherIncome = new Decimal(0);
    // Include internal use items (cleaning, maintenance, office supplies) plus additional expenses
    const otherExpenses = internalUseCost.plus(additionalExpenses);

    // Calculate totals
    const totalIncome = salesIncome.plus(tableRentIncome).plus(otherIncome);
    const totalExpense = inventoryCost
      .plus(totalMaintenanceCost)
      .plus(staffCost)
      .plus(utilityCost)
      .plus(otherExpenses);
    const netProfit = totalIncome.minus(totalExpense);

    console.log("Final Calculations Debug:", {
      companyId,
      reportType,
      dateRanges: {
        income: {
          from: parsedStartDate.toISOString(),
          to: parsedEndDate.toISOString(),
          note: "Business hours applied for POS orders and table sessions",
        },
        expenses: {
          from: expenseStartDate.toISOString(),
          to: expenseEndDate.toISOString(),
          note: "Full calendar day for stock movements, maintenance, and expenses",
        },
      },
      calculations: {
        salesIncome: salesIncome.toFixed(2),
        tableRentIncome: tableRentIncome.toFixed(2),
        otherIncome: otherIncome.toFixed(2),
        totalIncome: totalIncome.toFixed(2),
        inventoryCost: inventoryCost.toFixed(2),
        totalMaintenanceCost: totalMaintenanceCost.toFixed(2),
        staffCost: staffCost.toFixed(2),
        utilityCost: utilityCost.toFixed(2),
        otherExpenses: otherExpenses.toFixed(2),
        totalExpense: totalExpense.toFixed(2),
        netProfit: netProfit.toFixed(2),
      },
    });

    // Generate a unique ID for this temporary report
    const tempId = `temp-${Date.now()}`;

    // Return the calculated report data (without saving to database)
    const liveReportData = [
      {
        id: tempId,
        companyId,
        name: reportName,
        reportType,
        startDate: parsedStartDate,
        endDate: parsedEndDate,

        // Income data
        salesIncome: salesIncome.toFixed(2),
        tableRentIncome: tableRentIncome.toFixed(2),
        otherIncome: otherIncome.toFixed(2),
        totalIncome: totalIncome.toFixed(2),

        // Expense data
        inventoryCost: inventoryCost.toFixed(2),
        maintenanceCost: totalMaintenanceCost.toFixed(2),
        staffCost: staffCost.toFixed(2),
        utilityCost: utilityCost.toFixed(2),
        otherExpenses: otherExpenses.toFixed(2),
        totalExpense: totalExpense.toFixed(2),

        // Result
        netProfit: netProfit.toFixed(2),

        // Metadata
        generatedAt: new Date(),
        isLiveData: true,
      },
    ];

    return NextResponse.json(liveReportData);
  } catch (error) {
    console.error("Error calculating live report data:", error);
    return NextResponse.json(
      { error: "Failed to fetch live report data" },
      { status: 500 }
    );
  }
}
