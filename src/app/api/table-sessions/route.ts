import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET /api/table-sessions - Get all table sessions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tableId = searchParams.get("tableId");
    const status = searchParams.get("status");
    const companyId = searchParams.get("companyId");

    const sessions = await prisma.tableSession.findMany({
      where: {
        ...(tableId ? { tableId } : {}),
        ...(status ? { status: status as any } : {}),
        ...(companyId
          ? {
              table: {
                companyId,
              },
            }
          : {}),
      },
      include: {
        table: {
          select: {
            id: true,
            name: true,
            companyId: true,
            company: {
              select: {
                name: true,
              },
            },
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
          select: {
            id: true,
            amount: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching table sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch table sessions" },
      { status: 500 }
    );
  }
}

// POST /api/table-sessions - Create a new table session
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const body = await request.json();
    const { tableId, staffId, staffNotes } = body;

    // Validate required fields
    if (!tableId) {
      return NextResponse.json(
        { error: "Table ID is required" },
        { status: 400 }
      );
    }

    // Check if the table exists
    const table = await prisma.table.findUnique({
      where: { id: tableId },
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

    // Create a transaction to start session and update table status
    const result = await prisma.$transaction(async (tx) => {
      // Create session
      const session = await tx.tableSession.create({
        data: {
          tableId,
          staffId: staffId || undefined,
          startedAt: new Date(),
          status: "ACTIVE",
          staffNotes: staffNotes || undefined,
        },
      });

      // Update table status
      await tx.table.update({
        where: { id: tableId },
        data: { status: "OCCUPIED" },
      });

      // Log activity
      await tx.tableActivityLog.create({
        data: {
          tableId,
          previousStatus: "AVAILABLE",
          newStatus: "OCCUPIED",
          notes: "Table session started",
          changedById: staffId || undefined,
        },
      });

      return session;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating table session:", error);
    return NextResponse.json(
      { error: "Failed to create table session" },
      { status: 500 }
    );
  }
}
