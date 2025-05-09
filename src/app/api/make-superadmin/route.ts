import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    console.log("=== Make Superadmin Request ===");
    
    // Create Supabase client with cookies
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.log("No session found:", error?.message);
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    console.log("Current user ID:", userId);
    
    // Find user profile
    const profile = await prisma.profile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      console.log("Profile not found, creating new profile");
      // Create profile if doesn't exist
      const newProfile = await prisma.profile.create({
        data: {
          userId,
          role: UserRole.SUPERADMIN,
          active: true
        }
      });
      
      console.log("Created new superadmin profile:", newProfile.id);
      return NextResponse.json({
        message: "Created new superadmin profile",
        profile: newProfile
      });
    }
    
    // Update existing profile to superadmin
    const updatedProfile = await prisma.profile.update({
      where: { id: profile.id },
      data: { role: UserRole.SUPERADMIN }
    });
    
    console.log("Updated profile to superadmin:", updatedProfile.id);
    
    return NextResponse.json({
      message: "User promoted to superadmin",
      profile: updatedProfile
    });
  } catch (error: any) {
    console.error("Error promoting user to superadmin:", error);
    return NextResponse.json(
      { error: error.message || "Failed to promote user" },
      { status: 500 }
    );
  }
} 