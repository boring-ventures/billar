import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/table-sessions/[id]/move - Move a table session to another table
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = (await params).id;
    const body = await request.json();
    const { targetTableId } = body;

    if (!targetTableId) {
      return NextResponse.json(
        { error: "Target table ID is required" },
        { status: 400 }
      );
    }

    // Find the current session
    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        table: true,
        trackedItems: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Table session not found" },
        { status: 404 }
      );
    }

    // Check if session is active
    if (session.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Only active sessions can be moved" },
        { status: 400 }
      );
    }

    // Find the target table
    const targetTable = await prisma.table.findUnique({
      where: { id: targetTableId },
    });

    if (!targetTable) {
      return NextResponse.json(
        { error: "Target table not found" },
        { status: 404 }
      );
    }

    // Check if target table is available
    if (targetTable.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Target table is not available" },
        { status: 400 }
      );
    }

    // Check if target table has any active sessions
    const existingActiveSession = await prisma.tableSession.findFirst({
      where: {
        tableId: targetTableId,
        status: "ACTIVE",
      },
    });

    if (existingActiveSession) {
      return NextResponse.json(
        { error: "Target table already has an active session" },
        { status: 400 }
      );
    }

    // Perform the move in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the session with the new table ID
      const updatedSession = await tx.tableSession.update({
        where: { id: sessionId },
        data: {
          tableId: targetTableId,
        },
        include: {
          table: true,
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          trackedItems: {
            include: {
              item: true,
            },
          },
        },
      });

      // Update the original table status to AVAILABLE
      await tx.table.update({
        where: { id: session.tableId },
        data: { status: "AVAILABLE" },
      });

      // Update the target table status to OCCUPIED
      await tx.table.update({
        where: { id: targetTableId },
        data: { status: "OCCUPIED" },
      });

      // Log activity for the original table
      await tx.tableActivityLog.create({
        data: {
          tableId: session.tableId,
          previousStatus: "OCCUPIED",
          newStatus: "AVAILABLE",
          notes: `Session moved to table ${targetTable.name}`,
          changedById: session.staffId || undefined,
        },
      });

      // Log activity for the target table
      await tx.tableActivityLog.create({
        data: {
          tableId: targetTableId,
          previousStatus: "AVAILABLE",
          newStatus: "OCCUPIED",
          notes: `Session moved from table ${session.table.name}`,
          changedById: session.staffId || undefined,
        },
      });

      return updatedSession;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error moving table session:", error);
    return NextResponse.json(
      { error: "Failed to move table session" },
      { status: 500 }
    );
  }
}
