import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/table-sessions/[id]/cancel - Cancel a table session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = (await params).id;

    // Find session first to check if it exists and get table ID
    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        posOrders: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Table session not found" },
        { status: 404 }
      );
    }

    // Check if session is already completed or cancelled
    if (session.status === "COMPLETED" || session.status === "CANCELLED") {
      return NextResponse.json(
        { error: `Session is already ${session.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Create a transaction to cancel session and update table status
    const result = await prisma.$transaction(async (tx) => {
      // Update the session
      const updatedSession = await tx.tableSession.update({
        where: { id: sessionId },
        data: {
          status: "CANCELLED",
          endedAt: new Date(), // Set the end time to now
        },
      });

      // If session was active, reset table status to available
      if (session.status === "ACTIVE") {
        await tx.table.update({
          where: { id: session.tableId },
          data: { status: "AVAILABLE" },
        });

        // Log table activity
        await tx.tableActivityLog.create({
          data: {
            tableId: session.tableId,
            previousStatus: "OCCUPIED",
            newStatus: "AVAILABLE",
            notes: "Table session cancelled",
          },
        });
      }

      return updatedSession;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error cancelling table session:", error);
    return NextResponse.json(
      { error: "Failed to cancel table session" },
      { status: 500 }
    );
  }
}
