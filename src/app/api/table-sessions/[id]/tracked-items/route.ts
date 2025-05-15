import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/table-sessions/[id]/tracked-items - Get all tracked items for a specific table session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = (await params).id;

    // Check if the session exists
    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Table session not found" },
        { status: 404 }
      );
    }

    // Fetch all tracked items for this session
    const trackedItems = await prisma.sessionTrackedItem.findMany({
      where: {
        tableSessionId: sessionId,
      },
      include: {
        item: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(trackedItems);
  } catch (error) {
    console.error("Error fetching session tracked items:", error);
    return NextResponse.json(
      { error: "Failed to fetch session tracked items" },
      { status: 500 }
    );
  }
}

// POST /api/table-sessions/[id]/tracked-items - Add tracked items to a session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = (await params).id;
    const { items } = await request.json();

    // Check if the session exists
    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        table: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Table session not found" },
        { status: 404 }
      );
    }

    // Validate that items array exists and is not empty
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Check if all items have the required fields
    for (const item of items) {
      if (!item.itemId || !item.quantity || !item.unitPrice) {
        return NextResponse.json(
          {
            error: "Each item must have itemId, quantity, and unitPrice fields",
          },
          { status: 400 }
        );
      }
    }

    // Use a transaction to add all tracked items
    const result = await prisma.$transaction(async (tx) => {
      const trackedItems = [];

      for (const item of items) {
        // Check if item exists
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: item.itemId },
        });

        if (!inventoryItem) {
          throw new Error(`Item with ID ${item.itemId} not found`);
        }

        // Check if there's an existing tracked item for this session and item
        const existingTrackedItem = await tx.sessionTrackedItem.findFirst({
          where: {
            tableSessionId: sessionId,
            itemId: item.itemId,
          },
        });

        if (existingTrackedItem) {
          // Update quantity of existing tracked item
          const updatedItem = await tx.sessionTrackedItem.update({
            where: { id: existingTrackedItem.id },
            data: {
              quantity: existingTrackedItem.quantity + item.quantity,
            },
            include: {
              item: {
                select: {
                  name: true,
                  price: true,
                },
              },
            },
          });
          trackedItems.push(updatedItem);
        } else {
          // Create new tracked item
          const trackedItem = await tx.sessionTrackedItem.create({
            data: {
              tableSessionId: sessionId,
              itemId: item.itemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            },
            include: {
              item: {
                select: {
                  name: true,
                  price: true,
                },
              },
            },
          });
          trackedItems.push(trackedItem);
        }
      }

      return trackedItems;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adding tracked items to session:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to add tracked items to session",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/table-sessions/[id]/tracked-items - Clear all tracked items for a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = (await params).id;

    // Check if the session exists
    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Table session not found" },
        { status: 404 }
      );
    }

    // Delete all tracked items for this session
    await prisma.sessionTrackedItem.deleteMany({
      where: {
        tableSessionId: sessionId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing session tracked items:", error);
    return NextResponse.json(
      { error: "Failed to clear session tracked items" },
      { status: 500 }
    );
  }
}
