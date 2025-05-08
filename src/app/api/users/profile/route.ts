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
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get user profile
    const userProfile = await prisma.profile.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!userProfile) {
      return new NextResponse(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404 }
      );
    }

    // Return profile data
    return new NextResponse(JSON.stringify(userProfile));
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
} 