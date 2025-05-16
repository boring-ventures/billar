import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Decimal } from "decimal.js";

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // Get session to check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requestData = await request.json();
    const { companyId, reportType, startDate, endDate } = requestData;

    // Validate required data
    if (!companyId || !reportType || !startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: companyId, reportType, startDate, endDate",
        },
        { status: 400 }
      );
    }

    // Get user profile to link to the report
    const userProfile = await prisma.profile.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Parse dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Calculate the report name based on type and date range
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

    // Calculate inventory costs (purchases)
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
    });

    const inventoryCost = stockMovements.reduce((total, movement) => {
      const costPerItem = movement.costPrice || new Decimal(0);
      const quantity = movement.quantity;
      return total.plus(costPerItem.mul(quantity));
    }, new Decimal(0));

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

    // Other static values for now (could be expanded later)
    const otherIncome = new Decimal(0);
    const staffCost = new Decimal(0);
    const utilityCost = new Decimal(0);
    const otherExpenses = new Decimal(0);

    // Calculate totals
    const totalIncome = salesIncome.plus(tableRentIncome).plus(otherIncome);
    const totalExpense = inventoryCost
      .plus(maintenanceCost)
      .plus(staffCost)
      .plus(utilityCost)
      .plus(otherExpenses);
    const netProfit = totalIncome.minus(totalExpense);

    // Create the financial report
    const financialReport = await prisma.financialReport.create({
      data: {
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
        maintenanceCost: maintenanceCost.toFixed(2),
        staffCost: staffCost.toFixed(2),
        utilityCost: utilityCost.toFixed(2),
        otherExpenses: otherExpenses.toFixed(2),
        totalExpense: totalExpense.toFixed(2),

        // Result
        netProfit: netProfit.toFixed(2),

        // Metadata
        generatedById: userProfile.id,
      },
    });

    return NextResponse.json(financialReport);
  } catch (error) {
    console.error("Error generating financial report:", error);
    return NextResponse.json(
      { error: "Failed to generate financial report" },
      { status: 500 }
    );
  }
}
 