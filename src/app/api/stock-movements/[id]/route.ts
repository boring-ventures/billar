import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET /api/stock-movements/[id] - Get a specific stock movement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const movement = await prisma.stockMovement.findUnique({
      where: { id },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true,
          },
        },
      },
    });

    if (!movement) {
      return NextResponse.json(
        { error: "Movement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(movement);
  } catch (error) {
    console.error("Error fetching stock movement:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock movement" },
      { status: 500 }
    );
  }
}

// PUT /api/stock-movements/[id] - Update a stock movement (only for ADJUSTMENT types)
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
    const { quantity, reason, costPrice } = body;

    // Find the movement
    const movement = await prisma.stockMovement.findUnique({
      where: { id },
      include: {
        item: true,
      },
    });

    if (!movement) {
      return NextResponse.json(
        { error: "Movement not found" },
        { status: 404 }
      );
    }

    // Only allow updating ADJUSTMENT type movements
    if (movement.type !== "ADJUSTMENT") {
      return NextResponse.json(
        { error: "Only ADJUSTMENT type movements can be updated" },
        { status: 400 }
      );
    }

    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: "Quantity is required" },
        { status: 400 }
      );
    }

    // Use a transaction to update movement and item quantity
    const result = await prisma.$transaction(async (tx) => {
      // Calculate quantity difference
      const quantityDiff = quantity - movement.quantity;

      // Update the movement
      const updatedMovement = await tx.stockMovement.update({
        where: { id },
        data: {
          quantity,
          reason: reason || movement.reason,
          costPrice: costPrice !== undefined ? costPrice : movement.costPrice,
        },
      });

      // Update item quantity if quantity changed
      if (quantityDiff !== 0) {
        await tx.inventoryItem.update({
          where: { id: movement.itemId },
          data: {
            quantity: {
              increment: quantityDiff,
            },
            lastStockUpdate: new Date(),
          },
        });
      }

      return updatedMovement;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating stock movement:", error);
    return NextResponse.json(
      { error: "Failed to update stock movement" },
      { status: 500 }
    );
  }
}

// DELETE /api/stock-movements/[id] - Delete a stock movement (only for ADJUSTMENT types)
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

    // Find the movement
    const movement = await prisma.stockMovement.findUnique({
      where: { id },
      include: {
        item: true,
      },
    });

    if (!movement) {
      return NextResponse.json(
        { error: "Movement not found" },
        { status: 404 }
      );
    }

    // Only allow deleting ADJUSTMENT type movements
    if (movement.type !== "ADJUSTMENT") {
      return NextResponse.json(
        { error: "Only ADJUSTMENT type movements can be deleted" },
        { status: 400 }
      );
    }

    // Use a transaction to delete movement and update item quantity
    await prisma.$transaction(async (tx) => {
      // Delete the movement
      await tx.stockMovement.delete({
        where: { id },
      });

      // Revert the inventory quantity change
      await tx.inventoryItem.update({
        where: { id: movement.itemId },
        data: {
          quantity: {
            decrement: movement.quantity,
          },
          lastStockUpdate: new Date(),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting stock movement:", error);
    return NextResponse.json(
      { error: "Failed to delete stock movement" },
      { status: 500 }
    );
  }
}
