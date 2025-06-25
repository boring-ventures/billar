import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

// GET: Fetch profile for the current authenticated user
export async function GET() {
  try {
    // Create a new supabase client for each request with fresh cookies
    const cookieStore = cookies();

    // Debug cookie information
    console.log("Cookie store available:", !!cookieStore);

    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json(
        {
          error: "Authentication error",
          details: sessionError.message,
        },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json(
        {
          error: "Not authenticated",
          message: "No active session found",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log("Session user ID:", userId);

    try {
      // Fetch profile from the database
      const profile = await prisma.profile.findUnique({
        where: { userId },
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
          {
            error: "Profile not found",
            userId: userId,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(profile);
    } catch (dbError) {
      return NextResponse.json(
        {
          error: "Database error",
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch profile",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PUT: Update profile for the current authenticated user
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();
    const { firstName, lastName, avatarUrl, active } = data;

    // Update profile in the database
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        firstName,
        lastName,
        avatarUrl,
        active,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// POST: Create a new profile for the current authenticated user
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { userId, firstName, lastName, avatarUrl } = data;

    // If userId is provided directly (during signup flow)
    if (userId) {
      // Check if profile already exists
      const existingProfile = await prisma.profile.findUnique({
        where: { userId },
      });

      if (existingProfile) {
        return NextResponse.json(
          { error: "Profile already exists" },
          { status: 409 }
        );
      }

      // Create profile in the database
      const newProfile = await prisma.profile.create({
        data: {
          userId,
          firstName,
          lastName,
          avatarUrl,
          active: true,
          role: "SELLER",
        },
      });

      return NextResponse.json(newProfile, { status: 201 });
    }

    // Normal flow requiring authentication
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const authenticatedUserId = session.user.id;

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: authenticatedUserId },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "Profile already exists" },
        { status: 409 }
      );
    }

    // Create profile in the database
    const newProfile = await prisma.profile.create({
      data: {
        userId: authenticatedUserId,
        firstName,
        lastName,
        avatarUrl,
        active: true,
        role: "SELLER",
      },
    });

    return NextResponse.json(newProfile, { status: 201 });
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}
