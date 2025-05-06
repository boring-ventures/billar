import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!currentUser.profile?.id) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 400 }
      );
    }

    const { sessionId } = params;

    // Get the active session
    const session = await db.tableSession.findUnique({
      where: {
        id: sessionId,
        status: "ACTIVE",
      },
      include: {
        table: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Active session not found" },
        { status: 404 }
      );
    }

    // Check company access
    if (
      currentUser.profile.companyId &&
      session.table.companyId !== currentUser.profile.companyId
    ) {
      return NextResponse.json(
        { error: "You don't have access to this session" },
        { status: 403 }
      );
    }

    // Cancel session and update table status in a transaction
    const updatedSession = await db.$transaction(async (tx) => {
      // Update the session
      const updated = await tx.tableSession.update({
        where: { id: sessionId },
        data: {
          endedAt: new Date(),
          status: "CANCELLED",
        },
      });

      // Update table status
      await tx.table.update({
        where: { id: session.tableId },
        data: { status: "AVAILABLE" },
      });

      // Create activity log
      await tx.tableActivityLog.create({
        data: {
          tableId: session.tableId,
          previousStatus: "OCCUPIED",
          newStatus: "AVAILABLE",
          changedById: currentUser.profile.id,
          notes: "Session cancelled",
        },
      });

      return updated;
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error cancelling session:", error);
    return NextResponse.json(
      { error: "Failed to cancel session" },
      { status: 500 }
    );
  }
}
