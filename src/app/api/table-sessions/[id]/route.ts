import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper to calculate session cost based on hourly rate
const calculateSessionCost = (
  startTime: Date,
  endTime: Date,
  hourlyRate: number | null
) => {
  if (!hourlyRate) return null;

  const durationInMs = endTime.getTime() - startTime.getTime();
  const durationInHours = durationInMs / (1000 * 60 * 60);

  return Math.round(durationInHours * hourlyRate * 100) / 100;
};

// GET /api/table-sessions/[id] - Get a specific table session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = (await params).id;

    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        table: true,
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        posOrders: {
          include: {
            orderItems: {
              include: {
                item: {
                  select: {
                    name: true,
                  },
                },
              },
            },
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

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error fetching table session:", error);
    return NextResponse.json(
      { error: "Failed to fetch table session" },
      { status: 500 }
    );
  }
}

// PATCH /api/table-sessions/[id] - Update a table session (primarily to end a session)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = (await params).id;
    const body = await request.json();
    const { status, endSession } = body;

    // Find session first to check if it exists
    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        table: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Table session not found" },
        { status: 404 }
      );
    }

    // If we're ending the session
    if (endSession && session.status === "ACTIVE") {
      const endTime = new Date();
      const totalCost = calculateSessionCost(
        session.startedAt,
        endTime,
        session.table.hourlyRate
          ? parseFloat(session.table.hourlyRate.toString())
          : null
      );

      // Create a transaction to end session and update table status
      const result = await prisma.$transaction(async (tx) => {
        // Update the session
        const updatedSession = await tx.tableSession.update({
          where: { id: sessionId },
          data: {
            endedAt: endTime,
            totalCost,
            status: "COMPLETED",
          },
        });

        // Update table status
        await tx.table.update({
          where: { id: session.tableId },
          data: { status: "AVAILABLE" },
        });

        // Log activity
        await tx.tableActivityLog.create({
          data: {
            tableId: session.tableId,
            previousStatus: "OCCUPIED",
            newStatus: "AVAILABLE",
            notes: "Table session ended",
            // changedById would be set in a real app based on auth
          },
        });

        return updatedSession;
      });

      return NextResponse.json(result);
    }

    // Regular update (not ending session)
    const updatedSession = await prisma.tableSession.update({
      where: { id: sessionId },
      data: {
        status: status,
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error updating table session:", error);
    return NextResponse.json(
      { error: "Failed to update table session" },
      { status: 500 }
    );
  }
}

// DELETE /api/table-sessions/[id] - Delete a table session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = (await params).id;

    // Find session first to get the table ID and check if active
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

    // Check if the session has associated orders
    if (session.posOrders.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete session with associated orders" },
        { status: 400 }
      );
    }

    // Create a transaction to delete session and reset table status if active
    await prisma.$transaction(async (tx) => {
      // Delete the session
      await tx.tableSession.delete({
        where: { id: sessionId },
      });

      // If session was active, reset table status
      if (session.status === "ACTIVE") {
        await tx.table.update({
          where: { id: session.tableId },
          data: { status: "AVAILABLE" },
        });

        // Log activity
        await tx.tableActivityLog.create({
          data: {
            tableId: session.tableId,
            previousStatus: "OCCUPIED",
            newStatus: "AVAILABLE",
            notes: "Table session cancelled and deleted",
            // changedById would be set in a real app based on auth
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting table session:", error);
    return NextResponse.json(
      { error: "Failed to delete table session" },
      { status: 500 }
    );
  }
}
