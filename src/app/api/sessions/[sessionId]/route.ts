import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
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

    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the session
    const session = await db.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        table: {
          select: {
            id: true,
            name: true,
            hourlyRate: true,
            companyId: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        posOrders: {
          orderBy: {
            createdAt: "desc",
          },
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
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if the user has access to this session (company check)
    if (
      userProfile?.companyId &&
      session.table.companyId !== userProfile.companyId
    ) {
      return NextResponse.json(
        { error: "You don't have access to this session" },
        { status: 403 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error getting session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
