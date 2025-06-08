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
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        sessions: {
          orderBy: {
            startedAt: "desc",
          },
          take: 5,
        },
        reservations: {
          orderBy: {
            reservedFrom: "desc",
          },
          take: 5,
          include: {
            customer: true,
          },
        },
        maintenances: {
          orderBy: {
            maintenanceAt: "desc",
          },
          take: 5,
        },
        activityLogs: {
          orderBy: {
            changedAt: "desc",
          },
          take: 10,
          include: {
            changedBy: true,
          },
        },
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
    const { name, status, hourlyRate, active } = body;

    // Find table first to check if it exists and get current status
    const existingTable = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!existingTable) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // If we're deactivating the table (soft delete), check for active sessions
    if (active === false && existingTable.active === true) {
      const activeSessions = await prisma.tableSession.findMany({
        where: {
          tableId,
          status: "ACTIVE",
        },
      });

      if (activeSessions.length > 0) {
        return NextResponse.json(
          { error: "No se puede eliminar una mesa con sesiones activas" },
          { status: 400 }
        );
      }
    }

    // Create a transaction to update table and log activity if status changes
    const result = await prisma.$transaction(async (tx) => {
      // Update the table
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (status !== undefined) updateData.status = status;
      if (hourlyRate !== undefined)
        updateData.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : null;
      if (active !== undefined) updateData.active = active;

      const updatedTable = await tx.table.update({
        where: { id: tableId },
        data: updateData,
      });

      // If status is changing, log it in activity logs
      if (status && existingTable.status !== status) {
        await tx.tableActivityLog.create({
          data: {
            tableId,
            previousStatus: existingTable.status,
            newStatus: status,
            notes: `Status updated from ${existingTable.status} to ${status}`,
            // changedById would be set in a real application based on auth
          },
        });
      }

      // If we're deactivating the table, log this action
      if (active === false && existingTable.active === true) {
        await tx.tableActivityLog.create({
          data: {
            tableId,
            previousStatus: existingTable.status,
            newStatus: existingTable.status, // Status doesn't change, just deactivated
            notes: "Mesa eliminada (desactivada)",
            // changedById would be set in a real application based on auth
          },
        });
      }

      return updatedTable;
    });

    return NextResponse.json(result);
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

    // Check if the table exists
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

    // Check if table has active sessions or future reservations
    if (table._count.sessions > 0) {
      // For a real implementation, we would check if any sessions are ACTIVE
      return NextResponse.json(
        { error: "Cannot delete table with session history" },
        { status: 400 }
      );
    }

    if (table._count.reservations > 0) {
      // For a real implementation, we would check if any reservations are in the future
      return NextResponse.json(
        { error: "Cannot delete table with reservations" },
        { status: 400 }
      );
    }

    // Delete the table (in a real app, consider soft deletes instead)
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
