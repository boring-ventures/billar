import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET /api/inventory-items/[id] - Get a specific inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        stockMovements: {
          select: {
            id: true,
            quantity: true,
            type: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory item" },
      { status: 500 }
    );
  }
}

// PUT /api/inventory-items/[id] - Update an inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
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

// DELETE /api/inventory-items/[id] - Delete an inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

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
