import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

interface Company {
  id: string;
  name: string;
}

// GET /api/companies - Get all companies
export async function GET() {
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

    let companies: Company[] = [];

    // If user is a superadmin, get all companies
    if (userProfile.role === "SUPERADMIN") {
      companies = await prisma.company.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
        },
      });
    }
    // Otherwise, only get the company they belong to
    else if (userProfile.companyId) {
      companies = [
        {
          id: userProfile.companyId,
          name: userProfile.company?.name || "Company",
        },
      ];
    }

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
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
