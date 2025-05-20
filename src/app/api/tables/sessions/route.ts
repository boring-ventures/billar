import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");
    const active = searchParams.get("active");
    const limit = searchParams.has("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if user is authorized to access this company's data
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile || userProfile.companyId !== companyId) {
      return NextResponse.json(
        { error: "Unauthorized access to company data" },
        { status: 403 }
      );
    }

    // Query table sessions with filters
    const tableSessions = await prisma.tableSession.findMany({
      where: {
        table: {
          companyId,
        },
        ...(active === "true" && { status: "ACTIVE" }),
      },
      orderBy: {
        startedAt: "desc",
      },
      include: {
        table: true,
        staff: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      ...(limit && { take: limit }),
    });

    return NextResponse.json(tableSessions);
  } catch (error) {
    console.error("Error fetching table sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch table sessions" },
      { status: 500 }
    );
  }
}
