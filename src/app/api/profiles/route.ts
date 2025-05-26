import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { UserRole, Prisma } from "@prisma/client";

// GET: Fetch all profiles with optional filtering
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is SUPERADMIN
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile || currentUserProfile.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const active = searchParams.get("active");

    // Build the where clause for filtering
    const whereClause: Prisma.ProfileWhereInput = {};

    if (role) whereClause.role = role as UserRole;
    if (active !== null) whereClause.active = active === "true";

    // Fetch profiles from the database with company information
    const profiles = await prisma.profile.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get user emails from Supabase
    const profilesWithEmails = await Promise.all(
      profiles.map(async (profile) => {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(
            profile.userId
          );
          return {
            ...profile,
            user: {
              email: userData.user?.email || null,
            },
          };
        } catch (error) {
          console.error(
            `Error fetching user data for ${profile.userId}:`,
            error
          );
          return {
            ...profile,
            user: {
              email: null,
            },
          };
        }
      })
    );

    return NextResponse.json({ profiles: profilesWithEmails });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
