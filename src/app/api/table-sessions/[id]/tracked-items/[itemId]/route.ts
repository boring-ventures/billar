import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MovementType } from "@prisma/client";

// DELETE /api/table-sessions/[id]/tracked-items/[itemId] - Remove a specific tracked item from a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const sessionId = (await params).id;
    const trackedItemId = (await params).itemId;

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

    // Use a transaction to handle the operation
    await prisma.$transaction(async (tx) => {
      // Get the tracked item to be removed
      const trackedItem = await tx.sessionTrackedItem.findUnique({
        where: {
          id: trackedItemId,
        },
      });

      if (!trackedItem) {
        throw new Error("Tracked item not found");
      }

      // Create a stock movement to return the item to inventory
      await tx.stockMovement.create({
        data: {
          itemId: trackedItem.itemId,
          quantity: trackedItem.quantity, // Positive quantity for return to inventory
          type: MovementType.RETURN,
          reason: `Returned from session ${sessionId}`,
          reference: `Session: ${sessionId}, Item removed`,
          createdBy: session.staffId || "system",
        },
      });

      // Update inventory item quantity
      await tx.inventoryItem.update({
        where: { id: trackedItem.itemId },
        data: {
          quantity: {
            increment: trackedItem.quantity,
          },
          lastStockUpdate: new Date(),
        },
      });

      // Delete the tracked item
      await tx.sessionTrackedItem.delete({
        where: {
          id: trackedItemId,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing tracked item:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove tracked item",
      },
      { status: 500 }
    );
  }
}
