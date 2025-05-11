import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SessionStatus, TableStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const userProfile = await prisma.profile.findUnique({
      where: { userId: currentUser.id },
    });

    const { searchParams } = new URL(req.url);
    const tableId = searchParams.get("tableId");
    const status = searchParams.get("status") as SessionStatus | null;

    // Build the query
    const query: any = {
      where: {
        ...(tableId && { tableId }),
        ...(status && { status }),
      },
      include: {
        table: {
          select: {
            id: true,
            name: true,
            hourlyRate: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc" as const,
      },
    };

    // If the user has a company, filter by that company
    if (userProfile?.companyId) {
      query.where.table = {
        companyId: userProfile.companyId,
      };
    }

    const sessions = await db.tableSession.findMany(query);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error getting sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { tableId } = body;

    if (!tableId) {
      return NextResponse.json(
        { error: "Table ID is required" },
        { status: 400 }
      );
    }

    // Check if table exists and belongs to user's company
    const table = await db.table.findFirst({
      where: {
        id: tableId,
        ...(userProfile.companyId && {
          companyId: userProfile.companyId,
        }),
      },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Check if table is available
    if (table.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: `Table is not available (current status: ${table.status})` },
        { status: 400 }
      );
    }

    // Check if there's already an active session for this table
    const activeSession = await db.tableSession.findFirst({
      where: {
        tableId,
        status: "ACTIVE",
      },
    });

    if (activeSession) {
      return NextResponse.json(
        { error: "Table already has an active session" },
        { status: 400 }
      );
    }

    // Create session and update table status in a transaction
    const session = await db.$transaction(async (tx) => {
      // Create the session
      const newSession = await tx.tableSession.create({
        data: {
          tableId,
          staffId: userProfile.id,
          startedAt: new Date(),
          status: "ACTIVE",
        },
      });

      // Update table status
      await tx.table.update({
        where: { id: tableId },
        data: { status: "OCCUPIED" },
      });

      // Create activity log
      await tx.tableActivityLog.create({
        data: {
          tableId,
          previousStatus: "AVAILABLE",
          newStatus: "OCCUPIED",
          changedById: userProfile.id,
          notes: "Session started",
        },
      });

      return newSession;
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
