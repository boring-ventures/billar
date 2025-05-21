import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ReportType } from "@prisma/client";

interface ReportFilters {
  companyId: string;
  reportType?: ReportType;
  startDate?: {
    gte: Date;
  };
  endDate?: {
    lte: Date;
  };
}

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // Get session to check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the user's profile to check company access
    const userProfile = await prisma.profile.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        company: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Block sellers from accessing reports
    if (userProfile.role === "SELLER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");
    const reportType = searchParams.get("reportType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate required parameters
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // For non-superadmin users, enforce their company ID
    if (userProfile.role !== "SUPERADMIN") {
      // If the requested company is not the user's company, return an error
      if (userProfile.companyId !== companyId) {
        return NextResponse.json(
          {
            error: "Access denied: You can only view reports for your company",
          },
          { status: 403 }
        );
      }
    }

    // Build query filters
    const filters: ReportFilters = {
      companyId: companyId,
    };

    if (reportType) {
      filters.reportType = reportType as ReportType;
    }

    if (startDate) {
      filters.startDate = {
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      filters.endDate = {
        lte: new Date(endDate),
      };
    }

    // Fetch financial reports matching filters
    const reports = await prisma.financialReport.findMany({
      where: filters,
      orderBy: {
        generatedAt: "desc",
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
        generatedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching financial reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial reports" },
      { status: 500 }
    );
  }
}
