import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET /api/inventory-items - Get all inventory items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");
    const categoryId = searchParams.get("categoryId");
    const lowStock = searchParams.get("lowStock");

    // Configure where clause based on provided filters
    const whereClause: any = {};

    if (companyId) {
      whereClause.companyId = companyId;
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (lowStock === "true") {
      whereClause.quantity = {
        lte: prisma.inventoryItem.fields.criticalThreshold,
      };
    }

    const items = await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory items" },
      { status: 500 }
    );
  }
}

// POST /api/inventory-items - Create a new inventory item
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      companyId,
      categoryId,
      sku,
      quantity,
      price,
      criticalThreshold,
      stockAlerts,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // If categoryId is provided, check if it exists
    if (categoryId) {
      const category = await prisma.inventoryCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    // If SKU is provided, check if it's unique
    if (sku) {
      const existingItem = await prisma.inventoryItem.findUnique({
        where: { sku },
      });

      if (existingItem) {
        return NextResponse.json(
          { error: "An item with this SKU already exists" },
          { status: 400 }
        );
      }
    }

    // Create inventory item
    const item = await prisma.inventoryItem.create({
      data: {
        name,
        companyId,
        categoryId: categoryId || undefined,
        sku: sku || undefined,
        quantity: quantity || 0,
        price: price || undefined,
        criticalThreshold: criticalThreshold || 5,
        stockAlerts: stockAlerts !== undefined ? stockAlerts : true,
        lastStockUpdate: new Date(),
      },
    });

    // Create initial stock movement if quantity > 0
    if (quantity > 0) {
      await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          quantity,
          type: "PURCHASE",
          reason: "Initial stock",
        },
      });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}

// PUT /api/inventory-items?id={id} - Update an inventory item
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, categoryId, sku, price, criticalThreshold, stockAlerts } =
      body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // If categoryId is provided, check if it exists
    if (categoryId) {
      const category = await prisma.inventoryCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    // If SKU is changed, check if it's unique
    if (sku && sku !== existingItem.sku) {
      const itemWithSku = await prisma.inventoryItem.findUnique({
        where: { sku },
      });

      if (itemWithSku) {
        return NextResponse.json(
          { error: "An item with this SKU already exists" },
          { status: 400 }
        );
      }
    }

    // Update the item
    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name,
        categoryId: categoryId || undefined,
        sku: sku || undefined,
        price: price || undefined,
        criticalThreshold: criticalThreshold || undefined,
        stockAlerts: stockAlerts !== undefined ? stockAlerts : undefined,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory-items?id={id} - Delete an inventory item
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Check if item exists
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        posOrderItems: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check if item is used in orders
    if (item.posOrderItems.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete item with associated orders" },
        { status: 400 }
      );
    }

    // Delete related stock movements first
    await prisma.stockMovement.deleteMany({
      where: { itemId: id },
    });

    // Delete the item
    await prisma.inventoryItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    );
  }
}
