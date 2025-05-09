import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    console.log("=== Starting manual seed ===");

    // Create a test company
    let company = await prisma.company.findFirst({
      where: { name: "Test Company" },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "Test Company",
          address: "123 Test Street",
          phone: "555-1234",
        },
      });
    }

    console.log("Company:", company);

    // Update the currently logged in user to be a superadmin
    // Get the user ID from the request query parameter
    const userId = req.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    // Update or create the profile as superadmin
    const superadmin = await prisma.profile.upsert({
      where: { userId },
      update: {
        role: UserRole.SUPERADMIN,
      },
      create: {
        userId,
        firstName: "Super",
        lastName: "Admin",
        role: UserRole.SUPERADMIN,
      },
    });

    console.log("Superadmin profile:", superadmin);

    // Create inventory categories
    let category1 = await prisma.inventoryCategory.findFirst({
      where: {
        name: "Electronics",
        companyId: company.id,
      },
    });

    if (!category1) {
      category1 = await prisma.inventoryCategory.create({
        data: {
          name: "Electronics",
          description: "Electronic devices and accessories",
          companyId: company.id,
        },
      });
    }

    let category2 = await prisma.inventoryCategory.findFirst({
      where: {
        name: "Office Supplies",
        companyId: company.id,
      },
    });

    if (!category2) {
      category2 = await prisma.inventoryCategory.create({
        data: {
          name: "Office Supplies",
          description: "Office supplies and equipment",
          companyId: company.id,
        },
      });
    }

    console.log("Categories:", category1, category2);

    // Create inventory items
    let items = [];
    for (let i = 1; i <= 5; i++) {
      const sku = `TEST${i.toString().padStart(3, "0")}`;
      let item = await prisma.inventoryItem.findFirst({
        where: { sku },
      });

      if (!item) {
        item = await prisma.inventoryItem.create({
          data: {
            name: `Test Item ${i}`,
            sku,
            quantity: 10 * i,
            criticalThreshold: 5,
            price: 9.99 * i,
            categoryId: i % 2 === 0 ? category1.id : category2.id,
            companyId: company.id,
            lastStockUpdate: new Date(),
          },
        });
      }
      items.push(item);
    }

    console.log(`Created ${items.length} items`);

    // Create some stock movements
    const movements = [];
    for (const item of items) {
      const movement = await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          quantity: 5,
          type: "PURCHASE",
          reason: "Initial stock",
          createdBy: superadmin.id,
        },
      });
      movements.push(movement);
    }

    console.log(`Created ${movements.length} stock movements`);

    return NextResponse.json({
      success: true,
      data: {
        company,
        superadmin,
        categories: [category1, category2],
        items,
        movements,
      },
    });
  } catch (error: any) {
    console.error("Error during manual seed:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 