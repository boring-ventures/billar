import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

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
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { tableId } = params;

    // Get user profile to check company access
    const userProfile = await prisma.profile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        companyId: true,
        role: true,
      },
    });

    if (!userProfile) {
      return new NextResponse(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404 }
      );
    }

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
      return new NextResponse(JSON.stringify({ error: "Table not found" }), {
        status: 404,
      });
    }

    // Check if user has access to this table's company
    if (
      userProfile.companyId !== table.companyId &&
      userProfile.role !== "SUPERADMIN"
    ) {
      return new NextResponse(
        JSON.stringify({ error: "Access denied to this table" }),
        { status: 403 }
      );
    }

    return new NextResponse(JSON.stringify(table));
  } catch (error) {
    console.error("Error fetching table details:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tableId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { tableId } = params;

    // Get user profile to check company access and permissions
    const userProfile = await prisma.profile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        companyId: true,
        role: true,
      },
    });

    if (!userProfile) {
      return new NextResponse(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404 }
      );
    }

    // Only ADMIN and SUPERADMIN can update tables
    if (userProfile.role === "SELLER") {
      return new NextResponse(
        JSON.stringify({ error: "Insufficient permissions" }),
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
      return new NextResponse(JSON.stringify({ error: "Table not found" }), {
        status: 404,
      });
    }

    // Check if user has access to this table's company
    if (
      userProfile.companyId !== table.companyId &&
      userProfile.role !== "SUPERADMIN"
    ) {
      return new NextResponse(
        JSON.stringify({ error: "Access denied to this table" }),
        { status: 403 }
      );
    }

    const json = await req.json();
    const validationResult = tableUpdateSchema.safeParse(json);

    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: "Validation error",
          details: validationResult.error.errors,
        }),
        { status: 400 }
      );
    }

    const { name, status, hourlyRate } = validationResult.data;
    const updateData: any = {};

    // Only include fields that were provided
    if (name !== undefined) updateData.name = name;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;

    // If status is changing, create an activity log
    if (status !== undefined && status !== table.status) {
      // Create activity log in a transaction with the table update
      const updatedTable = await prisma.$transaction(async (tx) => {
        // Update the table
        const updatedTable = await tx.table.update({
          where: { id: tableId },
          data: { ...updateData, status },
        });

        // Create activity log
        await tx.tableActivityLog.create({
          data: {
            tableId,
            previousStatus: table.status,
            newStatus: status,
            changedById: userProfile.id,
          },
        });

        return updatedTable;
      });

      return new NextResponse(JSON.stringify(updatedTable));
    } else {
      // No status change, just update the other fields
      const updatedTable = await prisma.table.update({
        where: { id: tableId },
        data: updateData,
      });

      return new NextResponse(JSON.stringify(updatedTable));
    }
  } catch (error) {
    console.error("Error updating table:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tableId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { tableId } = params;

    // Get user profile to check company access and permissions
    const userProfile = await prisma.profile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        companyId: true,
        role: true,
      },
    });

    if (!userProfile) {
      return new NextResponse(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404 }
      );
    }

    // Only ADMIN and SUPERADMIN can delete tables
    if (userProfile.role === "SELLER") {
      return new NextResponse(
        JSON.stringify({ error: "Insufficient permissions" }),
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
      return new NextResponse(JSON.stringify({ error: "Table not found" }), {
        status: 404,
      });
    }

    // Check if user has access to this table's company
    if (
      userProfile.companyId !== table.companyId &&
      userProfile.role !== "SUPERADMIN"
    ) {
      return new NextResponse(
        JSON.stringify({ error: "Access denied to this table" }),
        { status: 403 }
      );
    }

    // Check if table has any associated sessions or reservations before deleting
    const sessionsCount = await prisma.tableSession.count({
      where: {
        tableId,
      },
    });

    const reservationsCount = await prisma.tableReservation.count({
      where: {
        tableId,
      },
    });

    if (sessionsCount > 0 || reservationsCount > 0) {
      return new NextResponse(
        JSON.stringify({
          error: "Cannot delete table with associated sessions or reservations",
        }),
        { status: 400 }
      );
    }

    // Delete associated activity logs first, then the table
    await prisma.$transaction([
      prisma.tableActivityLog.deleteMany({
        where: {
          tableId,
        },
      }),
      prisma.tableMaintenance.deleteMany({
        where: {
          tableId,
        },
      }),
      prisma.table.delete({
        where: {
          id: tableId,
        },
      }),
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting table:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
