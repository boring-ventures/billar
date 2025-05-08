import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
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
    const email = session.user.email;

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
      // Auto-create missing profile as a recovery mechanism
      try {
        console.log("Auto-creating missing profile for user:", userId);
        const newProfile = await prisma.profile.create({
          data: {
            userId,
            role: "SELLER", // Default role
            active: true,
          },
        });
        
        return NextResponse.json({
          ...newProfile,
          email,
          company: null,
        });
      } catch (createError) {
        console.error("Failed to auto-create profile:", createError);
        return NextResponse.json(
          { error: "Failed to create missing profile" },
          { status: 500 }
        );
      }
    }

    // Return profile with email from auth
    return NextResponse.json({
      ...profile,
      email,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
} 