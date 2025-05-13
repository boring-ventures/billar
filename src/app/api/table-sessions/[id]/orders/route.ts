import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/table-sessions/[id]/orders - Get all orders for a specific table session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = (await params).id;

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

    // Fetch all orders for this session with their items
    const orders = await prisma.posOrder.findMany({
      where: {
        tableSessionId: sessionId,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching session orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch session orders" },
      { status: 500 }
    );
  }
}
