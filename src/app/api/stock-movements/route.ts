import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { MovementType } from "@prisma/client";

// GET /api/stock-movements - Get stock movements for an item
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const movements = await prisma.stockMovement.findMany({
      where: {
        itemId,
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock movements" },
      { status: 500 }
    );
  }
}

// POST /api/stock-movements - Create a new stock movement
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
    const { itemId, quantity, type, costPrice, reason, reference } = body;

    // Validate required fields
    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: "Quantity is required" },
        { status: 400 }
      );
    }

    if (!type || !Object.values(MovementType).includes(type as MovementType)) {
      return NextResponse.json(
        { error: "Valid movement type is required" },
        { status: 400 }
      );
    }

    // Check if item exists
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // For SALE type, validate that we're not trying to remove more than available
    if (type === "SALE") {
      const removalQuantity = quantity < 0 ? Math.abs(quantity) : quantity;

      if (removalQuantity > item.quantity) {
        return NextResponse.json(
          {
            error: `Cannot remove ${removalQuantity} units. Only ${item.quantity} units available in stock.`,
          },
          { status: 400 }
        );
      }
    }

    // Use a transaction to update stock movement and item quantity
    const result = await prisma.$transaction(async (tx) => {
      // Get the staff profile ID from the user ID
      const staffProfile = await tx.profile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          itemId,
          quantity,
          type: type as MovementType,
          costPrice: costPrice || undefined,
          reason: reason || undefined,
          reference: reference || undefined,
          createdBy: staffProfile?.id || null,
        },
      });

      // Calculate new quantity based on movement type
      let newQuantity = item.quantity;

      // Check if the quantity is already negative (for SALE type)
      const isNegativeQuantity = quantity < 0;

      switch (type) {
        case "PURCHASE":
        case "ADJUSTMENT":
        case "RETURN":
          newQuantity += quantity;
          break;
        case "SALE":
        case "TRANSFER":
          if (isNegativeQuantity) {
            // If quantity is already negative (from frontend), just add it
            // This will decrease the stock since we're adding a negative number
            newQuantity += quantity;
          } else {
            // Otherwise subtract it (backwards compatibility)
            newQuantity = Math.max(0, newQuantity - quantity);
          }
          break;
      }

      // Update item quantity
      await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          quantity: newQuantity,
          lastStockUpdate: new Date(),
        },
      });

      return { movement, newQuantity };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating stock movement:", error);
    return NextResponse.json(
      { error: "Failed to create stock movement" },
      { status: 500 }
    );
  }
}

// PUT /api/stock-movements?id={id} - Update a stock movement (only for ADJUSTMENT types)
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
        { error: "Movement ID is required" },
        { status: 400 }
      );
    }

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
