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

    // Calculate session duration and cost
    const endTime = new Date();
    const startTime = new Date(session.startedAt);
    const durationInMilliseconds = endTime.getTime() - startTime.getTime();
    const durationInHours = durationInMilliseconds / (1000 * 60 * 60);

    // Calculate cost if hourly rate is set
    let totalCost = null;
    if (session.table.hourlyRate) {
      totalCost =
        parseFloat(session.table.hourlyRate.toString()) * durationInHours;
    }

    // End session and update table status in a transaction
    const updatedSession = await db.$transaction(async (tx) => {
      // Update the session
      const updated = await tx.tableSession.update({
        where: { id: sessionId },
        data: {
          endedAt: endTime,
          totalCost,
          status: "COMPLETED",
        },
        include: {
          table: {
            select: {
              id: true,
              name: true,
              hourlyRate: true,
            },
          },
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
          notes: "Session ended",
        },
      });

      return updated;
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 }
    );
  }
}
