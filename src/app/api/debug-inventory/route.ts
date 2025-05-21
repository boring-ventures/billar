import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET /api/debug-inventory - Debug endpoint to check user and profile data
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get categories for the user's company
    const categories = profile?.companyId
      ? await prisma.inventoryCategory.findMany({
          where: { companyId: profile.companyId },
          select: { id: true, name: true, companyId: true },
        })
      : [];

    const debugInfo = {
      user: {
        id: session.user.id,
        email: session.user.email,
      },
      profile: {
        id: profile?.id,
        role: profile?.role,
        companyId: profile?.companyId,
        hasCompany: !!profile?.company,
        company: profile?.company,
      },
      categories,
      database: {
        url: process.env.DATABASE_URL ? "Configured" : "Not configured",
        directUrl: process.env.DIRECT_URL ? "Configured" : "Not configured",
      },
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug info", details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/debug-inventory - Test creating an inventory item with validation
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Log the received request body
    console.log("DEBUG - Create item request body:", body);

    // Log the user's profile information
    console.log("DEBUG - User profile:", {
      id: profile.id,
      role: profile.role,
      companyId: profile.companyId,
      hasCompany: !!profile.company,
    });

    // Simple validation
    const validationResults = {
      hasCompanyId: !!profile.companyId,
      hasName: !!body.name,
      categoryExists: false,
      categoryBelongsToCompany: false,
    };

    // Check category if provided
    if (
      body.categoryId &&
      body.categoryId !== "none" &&
      body.categoryId !== ""
    ) {
      const category = await prisma.inventoryCategory.findUnique({
        where: { id: body.categoryId },
      });

      validationResults.categoryExists = !!category;

      if (category && profile.companyId) {
        validationResults.categoryBelongsToCompany =
          category.companyId === profile.companyId;
      }
    }

    // Return the validation results and debug info without actually creating the item
    return NextResponse.json({
      received: body,
      profile: {
        id: profile.id,
        role: profile.role,
        companyId: profile.companyId,
        company: profile.company,
      },
      validation: validationResults,
      wouldSucceed:
        validationResults.hasCompanyId &&
        validationResults.hasName &&
        (!body.categoryId || validationResults.categoryExists) &&
        (!body.categoryId || validationResults.categoryBelongsToCompany),
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process debug request", details: String(error) },
      { status: 500 }
    );
  }
}
