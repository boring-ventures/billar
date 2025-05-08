import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

const selectCompanySchema = z.object({
  companyId: z.string().uuid("Invalid company ID format"),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get user profile to check permissions
    const userProfile = await prisma.profile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!userProfile) {
      return new NextResponse(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404 }
      );
    }

    // Only SUPERADMIN can select a company
    if (userProfile.role !== "SUPERADMIN") {
      return new NextResponse(
        JSON.stringify({ error: "Only SUPERADMIN can select companies" }),
        { status: 403 }
      );
    }

    const json = await req.json();
    const validationResult = selectCompanySchema.safeParse(json);

    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: "Validation error",
          details: validationResult.error.errors,
        }),
        { status: 400 }
      );
    }

    const { companyId } = validationResult.data;

    // Check if company exists
    const companyExists = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });

    if (!companyExists) {
      return new NextResponse(JSON.stringify({ error: "Company not found" }), {
        status: 404,
      });
    }

    // Update user profile with selected company
    await prisma.profile.update({
      where: {
        id: userProfile.id,
      },
      data: {
        companyId,
      },
    });

    return new NextResponse(
      JSON.stringify({ message: "Company selected successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error selecting company:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
} 