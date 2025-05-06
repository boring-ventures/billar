import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

const statusUpdateSchema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"]),
  notes: z.string().optional(),
});

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

    // Get user profile
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
    const validationResult = statusUpdateSchema.safeParse(json);

    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: "Validation error",
          details: validationResult.error.errors,
        }),
        { status: 400 }
      );
    }

    const { status, notes } = validationResult.data;

    // If the status is the same, no need to update
    if (status === table.status) {
      return new NextResponse(
        JSON.stringify({ message: "Status is already set to " + status }),
        { status: 200 }
      );
    }

    // Check status transition permissions based on role
    if (userProfile.role === "SELLER") {
      // Sellers can only change between AVAILABLE and OCCUPIED
      const allowedTransitions = {
        AVAILABLE: ["OCCUPIED"],
        OCCUPIED: ["AVAILABLE"],
      };

      const currentStatusTransitions =
        allowedTransitions[table.status as keyof typeof allowedTransitions];

      if (
        !currentStatusTransitions ||
        !currentStatusTransitions.includes(status)
      ) {
        return new NextResponse(
          JSON.stringify({
            error: `Sellers cannot change table status from ${table.status} to ${status}`,
          }),
          { status: 403 }
        );
      }
    }

    // Create activity log in a transaction with the table update
    const updatedTable = await prisma.$transaction(async (tx) => {
      // Update the table status
      const updatedTable = await tx.table.update({
        where: { id: tableId },
        data: { status },
      });

      // Create activity log
      await tx.tableActivityLog.create({
        data: {
          tableId,
          previousStatus: table.status,
          newStatus: status,
          changedById: userProfile.id,
          notes,
        },
      });

      return updatedTable;
    });

    return new NextResponse(JSON.stringify(updatedTable));
  } catch (error) {
    console.error("Error updating table status:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
