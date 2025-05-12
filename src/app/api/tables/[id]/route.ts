import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/tables/[id] - Get a specific table
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tableId = (await params).id;

    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        company: true,
      },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error("Error fetching table:", error);
    return NextResponse.json(
      { error: "Failed to fetch table" },
      { status: 500 }
    );
  }
}

// PATCH /api/tables/[id] - Update a table
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tableId = (await params).id;
    const body = await request.json();
    const { name, status, hourlyRate } = body;

    const table = await prisma.table.update({
      where: { id: tableId },
      data: {
        name,
        status,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json(table);
  } catch (error) {
    console.error("Error updating table:", error);
    return NextResponse.json(
      { error: "Failed to update table" },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/[id] - Delete a table
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tableId = (await params).id;

    // First check if table has associated sessions or reservations
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        _count: {
          select: {
            sessions: true,
            reservations: true,
          },
        },
      },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Don't allow deletion if there are associated sessions or reservations
    if (table._count.sessions > 0 || table._count.reservations > 0) {
      return NextResponse.json(
        { error: "Cannot delete table with associated sessions or reservations" },
        { status: 400 }
      );
    }

    // Delete the table
    await prisma.table.delete({
      where: { id: tableId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { error: "Failed to delete table" },
      { status: 500 }
    );
  }
} 