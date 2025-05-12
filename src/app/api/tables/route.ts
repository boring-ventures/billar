import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");
    const query = searchParams.get("query") || "";

    const tables = await prisma.table.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(query ? {
          name: { contains: query, mode: "insensitive" },
        } : {}),
      },
      include: {
        company: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tables);
  } catch (error) {
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
    const { name, status, hourlyRate, companyId } = body;

    // If no companyId is provided, create a default company for superadmin
    let finalCompanyId = companyId;
    if (!finalCompanyId) {
      const defaultCompany = await prisma.company.findFirst({
        where: { name: "Default Company" },
      });

      if (!defaultCompany) {
        const newCompany = await prisma.company.create({
          data: {
            name: "Default Company",
            address: "System Generated",
            phone: "N/A",
          },
        });
        finalCompanyId = newCompany.id;
      } else {
        finalCompanyId = defaultCompany.id;
      }
    }

    const table = await prisma.table.create({
      data: {
        name,
        status,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        companyId: finalCompanyId,
      },
      include: {
        company: true,
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