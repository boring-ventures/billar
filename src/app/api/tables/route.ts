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