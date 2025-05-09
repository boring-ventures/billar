import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { z } from "zod";

// Validation schema for status updates
const statusUpdateSchema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"]),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tableId: string } }
) {
  try {
    // Authenticate request using middleware
    const profile = await authenticateRequest(req);
    
    const { tableId } = params;

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
    const validationResult = statusUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { status, notes } = validationResult.data;
    const previousStatus = table.status;

    // Don't update if status hasn't changed
    if (status === previousStatus) {
      return NextResponse.json({
        message: "Status unchanged",
        table: table,
      });
    }

    // Update table status and create activity log in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the table status
      const updatedTable = await tx.table.update({
        where: {
          id: tableId,
        },
        data: {
          status,
        },
      });

      // Create activity log entry
      const activityLog = await tx.tableActivityLog.create({
        data: {
          tableId,
          previousStatus,
          newStatus: status,
          changedById: profile.id,
          notes,
        },
      });

      return { table: updatedTable, activityLog };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating table status:", error);
    
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
