import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schema for report query parameters
const reportParamsSchema = z.object({
  reportType: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    console.log("GET Inventory Report - Profile role:", profile.role); // Debug log

    // Extract and validate query parameters
    const reportType = req.nextUrl.searchParams.get("reportType");
    const date = req.nextUrl.searchParams.get("date");

    if (!reportType || !date) {
      return NextResponse.json(
        { error: "Missing required parameters: reportType and date" },
        { status: 400 }
      );
    }

    try {
      reportParamsSchema.parse({ reportType, date });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Calculate date range based on report type
    const startDate = new Date(date);
    let endDate = new Date(date);

    switch (reportType) {
      case "DAILY":
        // Start and end are the same day
        endDate.setHours(23, 59, 59, 999);
        break;
      case "WEEKLY":
        // End date is 7 days after start
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "MONTHLY":
        // End date is last day of the month
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Set to last day of previous month
        endDate.setHours(23, 59, 59, 999);
        break;
      case "QUARTERLY":
        // End date is 3 months after start
        endDate.setMonth(endDate.getMonth() + 3);
        endDate.setDate(0); // Set to last day of previous month
        endDate.setHours(23, 59, 59, 999);
        break;
      case "ANNUAL":
        // End date is 1 year after start
        endDate.setFullYear(endDate.getFullYear() + 1);
        endDate.setDate(0); // Set to last day of previous month
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    // Initialize company filter based on user role
    let companyFilter: any = {};
    
    // For SUPERADMIN, show data across all companies
    if (profile.role === "SUPERADMIN") {
      // No company filter needed
    } else if (profile.companyId) {
      // Regular user can only see their company's data
      companyFilter = { companyId: profile.companyId };
    } else {
      // User has no company association and is not a superadmin
      return NextResponse.json(
        { error: "No company associated with profile" },
        { status: 400 }
      );
    }

    // Generate report data
    // 1. Get total number of products
    const totalProducts = await prisma.inventoryItem.count({
      where: companyFilter,
    });

    // 2. Get low stock items count
    const lowStockItems = await prisma.inventoryItem.count({
      where: {
        ...companyFilter,
        quantity: {
          lte: prisma.inventoryItem.fields.criticalThreshold,
        },
        stockAlerts: true,
      },
    });

    // 3. Calculate total inventory value
    const inventoryValueResult = await prisma.inventoryItem.aggregate({
      where: companyFilter,
      _sum: {
        price: true,
      },
    });
    
    const totalValue = inventoryValueResult._sum.price || 0;

    // 4. Get stock movement counts by type within date range
    const purchaseCount = await prisma.stockMovement.count({
      where: {
        type: "PURCHASE",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        item: {
          ...companyFilter,
        },
      },
    });

    const salesCount = await prisma.stockMovement.count({
      where: {
        type: "SALE",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        item: {
          ...companyFilter,
        },
      },
    });

    const adjustmentsCount = await prisma.stockMovement.count({
      where: {
        type: "ADJUSTMENT",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        item: {
          ...companyFilter,
        },
      },
    });

    // 5. Get top products by value
    const topProducts = await prisma.inventoryItem.findMany({
      where: companyFilter,
      select: {
        id: true,
        name: true,
        quantity: true,
        price: true,
      },
      orderBy: {
        price: "desc",
      },
      take: 5,
    });

    // Format top products data
    const formattedTopProducts = topProducts.map((product) => ({
      name: product.name,
      quantity: product.quantity,
      value: product.price ? Number(product.quantity) * Number(product.price) : 0,
    }));

    // Construct final report data
    const reportData = {
      totalProducts,
      lowStockItems,
      totalValue,
      stockMovements: {
        purchases: purchaseCount,
        sales: salesCount,
        adjustments: adjustmentsCount,
      },
      topProducts: formattedTopProducts,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      reportType,
    };

    // Return success response
    return NextResponse.json({ data: reportData });
  } catch (error: any) {
    console.error("Error generating inventory report:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
} 