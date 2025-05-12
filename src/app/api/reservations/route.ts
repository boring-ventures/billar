import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");
    const query = searchParams.get("query") || "";

    const reservations = await prisma.tableReservation.findMany({
      where: {
        table: {
          ...(companyId ? { companyId } : {}),
        },
      },
      include: {
        table: true,
        customer: true,
      },
      orderBy: {
        reservedFrom: "desc",
      },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
} 