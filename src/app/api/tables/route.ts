import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

const tableSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"]),
  hourlyRate: z.coerce.number().optional(),
  companyId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    // Get user profile to check company access
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

    // Only return tables for the user's company
    // If SUPERADMIN without company, return no tables (they need to select a company first)
    if (!userProfile.companyId) {
      return new NextResponse(JSON.stringify([]));
    }

    const where = {
      companyId: userProfile.companyId,
      ...(query
        ? {
            name: {
              contains: query,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const tables = await prisma.table.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    });

    return new NextResponse(JSON.stringify(tables));
  } catch (error) {
    console.error("Error fetching tables:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    // Only ADMIN and SUPERADMIN can create tables
    if (userProfile.role === "SELLER") {
      return new NextResponse(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403 }
      );
    }

    const json = await req.json();
    const validationResult = tableSchema.safeParse(json);

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

    // Use either provided companyId or the user's companyId
    const companyId = validationResult.data.companyId || userProfile.companyId;

    if (!companyId) {
      return new NextResponse(
        JSON.stringify({ error: "Company ID is required" }),
        { status: 400 }
      );
    }

    // SUPERADMIN can create tables for any company, ADMIN only for their own
    if (userProfile.role === "ADMIN" && companyId !== userProfile.companyId) {
      return new NextResponse(
        JSON.stringify({ error: "Cannot create table for another company" }),
        { status: 403 }
      );
    }

    // Check if company exists
    const companyExists = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });

    if (!companyExists) {
      return new NextResponse(JSON.stringify({ error: "Company not found" }), {
        status: 404,
      });
    }

    // Create the table
    const table = await prisma.table.create({
      data: {
        name,
        status,
        hourlyRate: hourlyRate !== undefined ? hourlyRate : null,
        companyId,
      },
    });

    // Create the initial activity log entry
    await prisma.tableActivityLog.create({
      data: {
        tableId: table.id,
        previousStatus: status, // Initial status is both previous and new
        newStatus: status,
        changedById: userProfile.id,
      },
    });

    return new NextResponse(JSON.stringify(table), { status: 201 });
  } catch (error) {
    console.error("Error creating table:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
