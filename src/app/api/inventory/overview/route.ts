import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    console.log("GET Inventory Overview - Profile role:", profile.role); // Debug log
    
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
      return NextResponse.json({ 
        data: {
          totalProducts: 0,
          lowStockItems: 0,
          recentMovements: 0,
          pendingOrders: 0
        }
      });
    }

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

    // 3. Get recent stock movements (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // For superadmin, we need to first get all items from all companies
    let itemIds: string[] = [];
    
    if (profile.role === "SUPERADMIN") {
      const allItems = await prisma.inventoryItem.findMany({
        select: { id: true }
      });
      itemIds = allItems.map(item => item.id);
    } else if (profile.companyId) {
      const companyItems = await prisma.inventoryItem.findMany({
        where: { companyId: profile.companyId },
        select: { id: true }
      });
      itemIds = companyItems.map(item => item.id);
    }
    
    const recentMovements = await prisma.stockMovement.count({
      where: {
        itemId: {
          in: itemIds
        },
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });

    // 4. Get pending orders (placeholder - you may need to adjust this based on your actual data model)
    // This is a placeholder implementation assuming you might have an orders table
    const pendingOrders = 0; // Replace with actual logic when needed

    // Construct overview data
    const overviewData = {
      totalProducts,
      lowStockItems,
      recentMovements,
      pendingOrders
    };

    // Return success response
    return NextResponse.json({ data: overviewData });
  } catch (error: any) {
    console.error("Error getting inventory overview:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
} 