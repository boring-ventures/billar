import { NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        error: "No authenticated user found",
        sessionError
      }, { status: 401 });
    }
    
    // Get the user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { company: true }
    });
    
    // Check permissions
    const isAdmin = profile?.role === "ADMIN";
    const isSuperAdmin = profile?.role === "SUPERADMIN";
    const canCreateUsers = isAdmin || isSuperAdmin;
    
    return NextResponse.json({
      authenticated: true,
      userId: session.user.id,
      email: session.user.email,
      profile: {
        id: profile?.id,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        role: profile?.role,
        companyId: profile?.companyId,
        companyName: profile?.company?.name
      },
      permissions: {
        isAdmin,
        isSuperAdmin,
        canCreateUsers
      }
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: "Server error", details: error }, { status: 500 });
  }
} 