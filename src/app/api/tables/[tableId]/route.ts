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
  { params }: { params: { tableId: string } }
) {
  try {
    // Authenticate request using middleware
    const profile = await authenticateRequest(req);
    
    const { tableId } = params;

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

    // Role-based access control pattern
    // Check if user has access to this table's company
    if (
      (profile.role !== "SUPERADMIN" && profile.companyId !== table.companyId) ||
      (profile.role === "SUPERADMIN" && profile.companyId && profile.companyId !== table.companyId)
    ) {
      // Regular users can only access their company's tables
      // Superadmins with selected company can only access that company's tables
      return NextResponse.json(
        { error: "Access denied to this table" },
        { status: 403 }
      );
    }

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
  { params }: { params: { tableId: string } }
) {
  try {
    // Authenticate request using middleware
    const profile = await authenticateRequest(req);
    
    const { tableId } = params;

    // Only ADMIN and SUPERADMIN can update tables
    if (profile.role !== "ADMIN" && profile.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Find the table to check company access
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

    // Role-based access control pattern
    // Check if user has access to this table's company
    if (
      (profile.role !== "SUPERADMIN" && profile.companyId !== table.companyId) ||
      (profile.role === "SUPERADMIN" && profile.companyId && profile.companyId !== table.companyId)
    ) {
      return NextResponse.json(
        { error: "Access denied to this table" },
        { status: 403 }
      );
    }

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

    // If status has changed, create an activity log entry
    if (data.status && data.status !== previousStatus) {
      await prisma.tableActivityLog.create({
        data: {
          tableId,
          previousStatus,
          newStatus: data.status,
          changedById: profile.id,
          notes: "Status updated via table edit",
        },
      });
    }

    return NextResponse.json(updatedTable);
  } catch (error: any) {
    console.error("Error updating table:", error);
    
    // Specific error handling for common cases
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tableId: string } }
) {
  try {
    // Authenticate request using middleware
    const profile = await authenticateRequest(req);
    
    const { tableId } = params;

    // Only ADMIN and SUPERADMIN can delete tables
    if (profile.role !== "ADMIN" && profile.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Find the table to check company access
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

    // Role-based access control pattern
    // Check if user has access to this table's company
    if (
      (profile.role !== "SUPERADMIN" && profile.companyId !== table.companyId) ||
      (profile.role === "SUPERADMIN" && profile.companyId && profile.companyId !== table.companyId)
    ) {
      return NextResponse.json(
        { error: "Access denied to this table" },
        { status: 403 }
      );
    }

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

    // Delete all related activity logs and maintenance records first
    await prisma.tableActivityLog.deleteMany({
      where: {
        tableId,
      },
    });

    await prisma.tableMaintenance.deleteMany({
      where: {
        tableId,
      },
    });

    // Finally delete the table
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
