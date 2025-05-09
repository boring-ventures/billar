import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    
    // SUPERADMIN implementation for inventory overview
    
    // Get total categories count
    const categoriesCount = await prisma.inventoryCategory.count();
    
    // Get total items count
    const itemsCount = await prisma.inventoryItem.count();
    
    // Get low stock items count
    const lowStockItemsCount = await prisma.inventoryItem.count({
      where: {
        quantity: {
          lte: prisma.inventoryItem.fields.criticalThreshold,
        },
      },
    });
    
    // Get total stock value
    const stockValue = await prisma.inventoryItem.aggregate({
      _sum: {
        price: true,
      },
    });
    
    // Get recent stock movements
    const recentMovements = await prisma.stockMovement.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // Return overview data
    return NextResponse.json({
      data: {
        categoriesCount,
        itemsCount,
        lowStockItemsCount,
        stockValue: stockValue._sum.price || 0,
        recentMovements,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
} 