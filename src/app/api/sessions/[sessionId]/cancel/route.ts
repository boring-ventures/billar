import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const userProfile = await prisma.profile.findUnique({
      where: { userId: currentUser.id },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 400 }
      );
    }

    const { sessionId } = await params;

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
      userProfile.companyId &&
      session.table.companyId !== userProfile.companyId
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
          changedById: userProfile.id,
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
