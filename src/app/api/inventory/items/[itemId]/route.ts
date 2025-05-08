import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id as string },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { itemId } = params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.companyId !== profile.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id as string },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { itemId } = params;
    const body = await req.json();

    // Check if the item exists and belongs to the user's company
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (existingItem.companyId !== profile.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Validate if category exists if provided
    if (body.categoryId) {
      const category = await prisma.inventoryCategory.findUnique({
        where: { id: body.categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 400 }
        );
      }

      if (category.companyId !== profile.companyId) {
        return NextResponse.json(
          { error: "Category does not belong to your company" },
          { status: 403 }
        );
      }
    }

    // If quantity has changed, record a stock movement
    let quantityChange = false;
    if (
      body.quantity !== undefined &&
      body.quantity !== existingItem.quantity
    ) {
      quantityChange = true;
    }

    // Update item
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        categoryId: body.categoryId !== undefined ? body.categoryId : undefined,
        sku: body.sku !== undefined ? body.sku : undefined,
        quantity: body.quantity !== undefined ? body.quantity : undefined,
        criticalThreshold:
          body.criticalThreshold !== undefined
            ? body.criticalThreshold
            : undefined,
        price: body.price !== undefined ? body.price : undefined,
        stockAlerts:
          body.stockAlerts !== undefined ? body.stockAlerts : undefined,
        ...(quantityChange ? { lastStockUpdate: new Date() } : {}),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create a stock movement if quantity changed
    if (quantityChange) {
      const difference = body.quantity - existingItem.quantity;
      await prisma.stockMovement.create({
        data: {
          itemId,
          quantity: Math.abs(difference),
          type: difference > 0 ? "ADJUSTMENT" : "ADJUSTMENT",
          reason: "Manual adjustment from item edit",
          createdBy: profile.id,
        },
      });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id as string },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { itemId } = params;

    // Check if the item exists and belongs to the user's company
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (existingItem.companyId !== profile.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if the item has movements associated with it
    const movementCount = await prisma.stockMovement.count({
      where: { itemId },
    });

    // Check if the item is part of any POS order
    const orderItemCount = await prisma.posOrderItem.count({
      where: { itemId },
    });

    if (movementCount > 0 || orderItemCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete item with associated movements or orders" },
        { status: 400 }
      );
    }

    // Delete item
    await prisma.inventoryItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
