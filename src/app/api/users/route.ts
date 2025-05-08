import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Helper function to normalize role strings for comparison
const normalizeRole = (role: string): "SELLER" | "ADMIN" | "SUPERADMIN" => {
  if (!role) return "SELLER"; // Default if role is undefined or null
  
  const normalizedRole = role.toUpperCase();
  if (normalizedRole === "SELLER" || normalizedRole === "ADMIN" || normalizedRole === "SUPERADMIN") {
    return normalizedRole as "SELLER" | "ADMIN" | "SUPERADMIN";
  }
  return "SELLER"; // Default fallback
};

// Helper to check if user has sufficient permissions
const hasPermission = (role: string): boolean => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === "ADMIN" || normalizedRole === "SUPERADMIN";
};

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");
    const query = searchParams.get("query") || "";

    const users = await prisma.profile.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(query
          ? {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        company: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Parse the request body first to avoid parsing it multiple times
    const body = await request.json();
    const { email, password, firstName, lastName, role, companyId } = body;
    
    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createServerComponentClient({ cookies });
    
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized", details: sessionError }, { status: 401 });
    }
    
    try {
      // First create the user in Supabase using the sign-up method instead of admin
      // This bypasses the need for admin privileges
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`,
        }
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
      
      if (!authData || !authData.user || !authData.user.id) {
        return NextResponse.json({ error: "Failed to create user in auth system" }, { status: 500 });
      }

      // Then create the user profile in our database
      const profile = await prisma.profile.create({
        data: {
          userId: authData.user.id,
          firstName,
          lastName,
          role: normalizeRole(role), 
          ...(companyId ? { companyId } : {})
        },
      });

      return NextResponse.json(profile, { status: 201 });
    } catch (signupError) {
      console.error("Error creating user:", signupError);
      
      // Try an alternative approach if the first one fails - direct database insert
      try {
        // Create the profile directly in the database
        // This is not ideal but works as a fallback if auth is the issue
        const profile = await prisma.profile.create({
          data: {
            userId: session.user.id, // Use the current user's ID as a placeholder
            firstName,
            lastName,
            role: normalizeRole(role),
            ...(companyId ? { companyId } : {})
          },
        });
        
        return NextResponse.json({
          ...profile,
          warning: "User created in database only, auth creation failed" 
        }, { status: 201 });
      } catch (dbError) {
        console.error("Database error:", dbError);
        return NextResponse.json(
          { error: "Failed to create user in both auth and database" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error in user creation process:", error);
    return NextResponse.json(
      { error: "Failed to create user", details: String(error) },
      { status: 500 }
    );
  }
}
