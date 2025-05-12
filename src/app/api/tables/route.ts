import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/tables - Get all tables
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const companyId = searchParams.get("companyId");
    const status = searchParams.get("status");

    const tables = await prisma.table.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(status ? { status: status as any } : {}),
        ...(query
          ? {
              name: { contains: query, mode: "insensitive" },
            }
          : {}),
      },
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
    const body = await request.json();
    const { companyId, name, status, hourlyRate } = body;

    // Validate required fields
    if (!companyId) {
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
