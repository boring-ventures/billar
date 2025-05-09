import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/companies - Get all companies
export async function GET(request: NextRequest) {
  try {
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

    // Ensure we always return an array
    return NextResponse.json(companies || []);
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
