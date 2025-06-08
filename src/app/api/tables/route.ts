import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TableStatus, Prisma } from "@prisma/client";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET /api/tables - Get all tables
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user's profile to check permissions
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const requestedCompanyId = searchParams.get("companyId");
    const status = searchParams.get("status");
    const query = searchParams.get("query") || "";

    // Build query based on user role and company
    const whereClause: Prisma.TableWhereInput = {};

    // If the user is a SUPERADMIN, they can access all tables
    // If the user is an ADMIN or SELLER, they can only access tables from their company
    if (currentUserProfile.role !== "SUPERADMIN") {
      // Non-superadmins can only access tables from their own company
      if (!currentUserProfile.companyId) {
        return NextResponse.json(
          { error: "Unauthorized: No company association" },
          { status: 403 }
        );
      }

      // Force company filter to be the user's company
      whereClause.companyId = currentUserProfile.companyId;
    } else if (requestedCompanyId) {
      // Superadmin can filter by company if requested
      whereClause.companyId = requestedCompanyId;
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status as TableStatus;
    }

    // Add search query filter if provided
    if (query) {
      whereClause.name = { contains: query, mode: "insensitive" };
    }

    // Only show active tables by default
    whereClause.active = true;

    const tables = await prisma.table.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            sessions: true,
            reservations: true,
            maintenances: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: "Failed to fetch tables" },
      { status: 500 }
    );
  }
}

// POST /api/tables - Create a new table
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user's profile to check permissions
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, status, hourlyRate } = body;
    let { companyId } = body;

    // Determine the company ID to use
    // If not a superadmin, force the company ID to be the current user's company
    if (currentUserProfile.role !== "SUPERADMIN") {
      if (!currentUserProfile.companyId) {
        return NextResponse.json(
          {
            error: "Cannot create table: You are not associated with a company",
          },
          { status: 403 }
        );
      }

      // Override any provided company ID with the user's company ID
      companyId = currentUserProfile.companyId;
    } else if (!companyId) {
      // For superadmins, companyId is still required
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Table name is required" },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const table = await prisma.table.create({
      data: {
        companyId,
        name,
        status: status || "AVAILABLE",
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error("Error creating table:", error);
    return NextResponse.json(
      { error: "Failed to create table" },
      { status: 500 }
    );
  }
}
