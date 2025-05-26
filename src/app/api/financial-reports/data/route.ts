import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Decimal } from "decimal.js";

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

    // Parse dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Calculate report name based on type and date range
    let reportName = "";
    switch (reportType) {
      case "DAILY":
        reportName = `Reporte Diario ${parsedStartDate.toLocaleDateString()}`;
        break;
      case "WEEKLY":
        reportName = `Reporte Semanal ${parsedStartDate.toLocaleDateString()} - ${parsedEndDate.toLocaleDateString()}`;
        break;
      case "MONTHLY":
        reportName = `Reporte Mensual ${parsedStartDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}`;
        break;
      case "QUARTERLY":
        reportName = `Reporte Trimestral ${Math.ceil((parsedStartDate.getMonth() + 1) / 3)} ${parsedStartDate.getFullYear()}`;
        break;
      case "ANNUAL":
        reportName = `Reporte Anual ${parsedStartDate.getFullYear()}`;
        break;
      default:
        reportName = `Reporte Personalizado ${parsedStartDate.toLocaleDateString()} - ${parsedEndDate.toLocaleDateString()}`;
    }

    // Calculate financial data from POS orders (sales income)
    const posOrders = await prisma.posOrder.findMany({
      where: {
        companyId,
        createdAt: {
          gte: parsedStartDate,
          lte: parsedEndDate,
        },
        paymentStatus: "PAID",
      },
      include: {
        orderItems: true,
      },
    });

    // Calculate sales income from POS orders
    const salesIncome = posOrders.reduce((total, order) => {
      return total.plus(order.amount || 0);
    }, new Decimal(0));

    // Calculate table rent income from table sessions
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

    const tableRentIncome = tableSessions.reduce((total, session) => {
      return total.plus(session.totalCost || 0);
    }, new Decimal(0));

    // Calculate inventory costs (purchases) - separate by item type
    const stockMovements = await prisma.stockMovement.findMany({
      where: {
        createdAt: {
          gte: parsedStartDate,
          lte: parsedEndDate,
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
    const maintenances = await prisma.tableMaintenance.findMany({
      where: {
        maintenanceAt: {
          gte: parsedStartDate,
          lte: parsedEndDate,
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
    const expenses = await prisma.expense.findMany({
      where: {
        companyId,
        expenseDate: {
          gte: parsedStartDate,
          lte: parsedEndDate,
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
