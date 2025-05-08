import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

    const itemId = req.nextUrl.searchParams.get("itemId");

    // Build query to fetch only movements for items in the user's company
    let query: any = {
      where: {},
      include: {
        item: {
          select: {
            id: true,
            name: true,
            companyId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    };

    if (itemId) {
      // If itemId is provided, filter by that specific item
      query.where.itemId = itemId;
    } else {
      // If no itemId, fetch all movements for the company's items
      query.where = {
        item: {
          companyId: profile.companyId,
        },
      };
    }

    const movements = await prisma.stockMovement.findMany(query);

    // Filter out any items that don't belong to the company
    // This is an extra security measure
    const filteredMovements = movements.filter(
      (movement) => movement.item.companyId === profile.companyId
    );

    return NextResponse.json(filteredMovements);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();

    // Validate required fields
    if (!body.itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    if (!body.quantity || body.quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be a positive number" },
        { status: 400 }
      );
    }

    if (!body.type) {
      return NextResponse.json(
        { error: "Movement type is required" },
        { status: 400 }
      );
    }

    // Check if item exists and belongs to the user's company
    const item = await prisma.inventoryItem.findUnique({
      where: { id: body.itemId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.companyId !== profile.companyId) {
      return NextResponse.json(
        { error: "Unauthorized access to this item" },
        { status: 403 }
      );
    }

    // Calculate new quantity based on movement type
    let newQuantity = item.quantity;

    switch (body.type) {
      case "PURCHASE":
      case "RETURN":
        newQuantity += body.quantity;
        break;
      case "SALE":
      case "TRANSFER":
        newQuantity -= body.quantity;
        // Don't allow negative stock
        if (newQuantity < 0) {
          return NextResponse.json(
            { error: "Not enough inventory available" },
            { status: 400 }
          );
        }
        break;
      case "ADJUSTMENT":
        // For adjustments, the quantity is already the final amount
        newQuantity = body.quantity;
        break;
    }

    // Use a transaction to update both the stock movement and item
    const result = await prisma.$transaction(async (tx) => {
      // Create the stock movement
      const movement = await tx.stockMovement.create({
        data: {
          itemId: body.itemId,
          quantity: body.quantity,
          type: body.type,
          costPrice: body.costPrice || null,
          reason: body.reason || null,
          reference: body.reference || null,
          createdBy: profile.id,
        },
      });

      // Update the item's quantity
      const updatedItem = await tx.inventoryItem.update({
        where: { id: body.itemId },
        data: {
          quantity: newQuantity,
          lastStockUpdate: new Date(),
        },
      });

      return { movement, updatedItem };
    });

    return NextResponse.json(result.movement, { status: 201 });
  } catch (error) {
    console.error("Error creating stock movement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
