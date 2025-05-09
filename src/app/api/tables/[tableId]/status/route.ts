import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { z } from "zod";
import { TableStatus } from "@prisma/client";

// Validation schema for table status updates
const tableStatusSchema = z.object({
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
    console.log("Using SUPERADMIN access pattern for table status update");

    // Parse and validate request body
    const body = await req.json();
    const validationResult = tableStatusSchema.safeParse(body);

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

    // Update the table status
    await prisma.table.update({
      where: {
        id: tableId,
      },
      data: {
        status,
      },
    });

    // Create activity log entry
    const activityLog = await prisma.tableActivityLog.create({
      data: {
        tableId,
        previousStatus,
        newStatus: status as TableStatus,
        changedById: profile.id,
        notes: notes || "Status updated",
      },
    });

    return NextResponse.json({
      success: true,
      status,
      activityLog,
    });
  } catch (error: any) {
    console.error("Error updating table status:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
