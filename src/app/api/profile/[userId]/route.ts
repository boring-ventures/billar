import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    console.log("=== Profile GET Request ===");
    const userId = (await params).userId;
    console.log("Requested profile for userId:", userId);

    // Create Supabase client with awaited cookies
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("No session found or session error:", sessionError?.message);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("Session user:", {
      id: session.user.id,
      email: session.user.email,
    });

    // Only allow users to view their own profile (or admin users to view any profile)
    const currentUser = session.user;
    const userProfile = await prisma.profile.findUnique({
      where: { userId: currentUser.id },
    });

    console.log("Current user profile:", userProfile || "Not found");

    // If current user is requesting their own profile but it doesn't exist,
    // create it automatically as a recovery mechanism
    if (userId === currentUser.id && !userProfile) {
      try {
        console.log("Auto-creating missing profile for user:", userId);
        const newProfile = await prisma.profile.create({
          data: {
            userId,
            role: UserRole.SELLER,
            active: true,
          },
        });
        console.log("Profile successfully created:", newProfile.id, "with role:", newProfile.role);
        return NextResponse.json({ profile: newProfile });
      } catch (createError) {
        console.error("Failed to auto-create profile:", createError);
        return NextResponse.json(
          { error: "Failed to create missing profile" },
          { status: 500 }
        );
      }
    }

    if (userId !== currentUser.id && userProfile?.role !== "SUPERADMIN") {
      console.log("Unauthorized access attempt: Not requesting own profile and not superadmin");
      return NextResponse.json(
        { error: "Unauthorized to view this profile" },
        { status: 403 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      console.log("Profile not found for userId:", userId);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    console.log("Returning profile for userId:", userId, "with role:", profile.role);
    
    // For testing: Force SUPERADMIN role if needed
    // if (userId === currentUser.id) {
    //   profile.role = UserRole.SUPERADMIN;
    //   console.log("FORCED SUPERADMIN role for testing");
    // }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const userId = (await params).userId;

    // Create Supabase client with awaited cookies
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Only allow users to update their own profile (or admin users to update any profile)
    const currentUser = session.user;
    const userProfile = await prisma.profile.findUnique({
      where: { userId: currentUser.id },
    });

    if (userId !== currentUser.id && userProfile?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized to update this profile" },
        { status: 403 }
      );
    }

    const json = await request.json();

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        firstName: json.firstName || undefined,
        lastName: json.lastName || undefined,
        avatarUrl: json.avatarUrl || undefined,
        active: json.active !== undefined ? json.active : undefined,
      },
    });

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
