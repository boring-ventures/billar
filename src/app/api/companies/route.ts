import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/companies - Get all companies
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/companies - Fetching companies");
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";

    const companies = await prisma.company.findMany({
      where: {
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { address: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: {
            profiles: true,
            tables: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Ensure we always return a valid array with properly structured objects
    const safeCompanies = Array.isArray(companies) 
      ? companies
          .filter(company => company && typeof company === 'object')
          .map(company => ({
            id: company.id || "",
            name: company.name || "",
            address: company.address,
            phone: company.phone,
            _count: company._count || { profiles: 0, tables: 0 }
          }))
      : [];
      
    console.log(`GET /api/companies - Found ${safeCompanies.length} companies`);
    return NextResponse.json(safeCompanies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    // Return empty array instead of error object in case of errors
    return NextResponse.json([]);
  }
}

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, phone } = body;

    const company = await prisma.company.create({
      data: {
        name,
        address,
        phone,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
