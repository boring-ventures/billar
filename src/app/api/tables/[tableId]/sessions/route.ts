import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
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

    const { tableId } = await params;

    // Check if table exists and belongs to user's company
    const table = await db.table.findFirst({
      where: {
        id: tableId,
        ...(userProfile?.companyId && {
          companyId: userProfile.companyId,
        }),
      },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Get all sessions for this table
    const sessions = await db.tableSession.findMany({
      where: {
        tableId,
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error getting table sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch table sessions" },
      { status: 500 }
    );
  }
}
