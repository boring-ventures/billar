import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { z } from "zod";

// Validation schema for table updates
const tableUpdateSchema = z.object({
  name: z.string().min(1, "Table name is required").optional(),
  status: z
    .enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"])
    .optional(),
  hourlyRate: z.coerce.number().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    // Authenticate request using middleware
    const profile = await authenticateRequest(req);
    
    const { tableId } = await params;

    // Find the table including related data
    const table = await prisma.table.findUnique({
      where: {
        id: tableId,
      },
      include: {
        activityLogs: {
          orderBy: {
            changedAt: "desc",
          },
          select: {
            id: true,
            previousStatus: true,
            newStatus: true,
            changedAt: true,
            notes: true,
            changedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        maintenances: {
          orderBy: {
            maintenanceAt: "desc",
          },
          select: {
            id: true,
            description: true,
            maintenanceAt: true,
            cost: true,
          },
        },
        sessions: {
          take: 5,
          orderBy: {
            startedAt: "desc",
          },
          select: {
            id: true,
            startedAt: true,
            endedAt: true,
            totalCost: true,
            status: true,
          },
        },
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    // Force SUPERADMIN access pattern - no company restrictions
    console.log("Using SUPERADMIN access pattern for table details");

    return NextResponse.json(table);
  } catch (error: any) {
    console.error("Error fetching table details:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    // Authenticate request using middleware
    const profile = await authenticateRequest(req);
    
    const { tableId } = await params;

    // Find the table
    const table = await prisma.table.findUnique({
      where: {
        id: tableId,
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    // Force SUPERADMIN access pattern - no company restrictions
    console.log("Using SUPERADMIN access pattern for table update");

    // Parse and validate request body
    const body = await req.json();
    const validationResult = tableUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const previousStatus = table.status;

    // Update the table
    const updatedTable = await prisma.table.update({
      where: {
        id: tableId,
      },
      data,
    });

    // Log status change if status was updated
    if (data.status && data.status !== previousStatus) {
      await prisma.tableActivityLog.create({
        data: {
          tableId: tableId,
          previousStatus: previousStatus,
          newStatus: data.status,
          changedById: profile.id,
          notes: body.notes || "",
        },
      });
    }

    return NextResponse.json(updatedTable);
  } catch (error: any) {
    console.error("Error updating table:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    // Authenticate request using middleware
    const profile = await authenticateRequest(req);
    
    const { tableId } = await params;

    // Find the table
    const table = await prisma.table.findUnique({
      where: {
        id: tableId,
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    // Force SUPERADMIN access pattern - no company restrictions
    console.log("Using SUPERADMIN access pattern for table deletion");

    // Check if table has any associated sessions or reservations before deleting
    const sessionsCount = await prisma.tableSession.count({
      where: {
        tableId,
      },
    });

    if (sessionsCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete table with existing sessions. Please delete all sessions first.",
        },
        { status: 400 }
      );
    }

    const reservationsCount = await prisma.tableReservation.count({
      where: {
        tableId,
      },
    });

    if (reservationsCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete table with existing reservations. Please delete all reservations first.",
        },
        { status: 400 }
      );
    }

    // Delete related maintenance records first
    await prisma.tableMaintenance.deleteMany({
      where: {
        tableId,
      },
    });

    // Delete activity logs
    await prisma.tableActivityLog.deleteMany({
      where: {
        tableId,
      },
    });

    // Finally, delete the table
    await prisma.table.delete({
      where: {
        id: tableId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
