import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { saltAndHashPassword } from "@/lib/auth/password-crypto-server";

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user's profile to check permissions
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const requestedCompanyId = searchParams.get("companyId");
    const query = searchParams.get("query") || "";

    // Build query based on user role and company
    let whereClause: any = {};

    // If the user is a SUPERADMIN, they can access all users
    // If the user is an ADMIN or SELLER, they can only access users from their company
    if (currentUserProfile.role !== "SUPERADMIN") {
      // Non-superadmins can only access users from their own company
      if (!currentUserProfile.companyId) {
        return NextResponse.json(
          { error: "Unauthorized: No company association" },
          { status: 403 }
        );
      }

      // Force company filter to be the user's company
      whereClause.companyId = currentUserProfile.companyId;
    } else if (requestedCompanyId) {
      // Superadmin can filter by company if requested
      whereClause.companyId = requestedCompanyId;
    }

    // Add search query filter if provided
    if (query) {
      whereClause.OR = [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
      ];
    }

    const users = await prisma.profile.findMany({
      where: whereClause,
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
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user's profile to check permissions
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email, password, firstName, lastName, role, companyId } = body;

    // Determine the company ID to use
    let userCompanyId = companyId;

    // If not a superadmin, force the company ID to be the current user's company
    if (currentUserProfile.role !== "SUPERADMIN") {
      if (!currentUserProfile.companyId) {
        return NextResponse.json(
          {
            error: "Cannot create user: You are not associated with a company",
          },
          { status: 403 }
        );
      }

      // Override any provided company ID with the admin's company ID
      userCompanyId = currentUserProfile.companyId;
    }

    // Additional permission checks for role assignment
    if (currentUserProfile.role !== "SUPERADMIN") {
      // Non-superadmins cannot create SUPERADMIN users
      if (role === "SUPERADMIN") {
        return NextResponse.json(
          { error: "Unauthorized to create users with SUPERADMIN role" },
          { status: 403 }
        );
      }
    }

    // IMPORTANT: Hash the password exactly the same way as the client-side does
    // Client uses the format: password:email with SHA-256
    // We need to replicate this exactly
    const normalizedEmail = email.toLowerCase();
    const saltedPassword = `${password}:${normalizedEmail}`;
    const crypto = require("crypto");
    const hashedPassword = crypto
      .createHash("sha256")
      .update(saltedPassword)
      .digest("hex");

    // IMPORTANT: For compatibility with the login process which uses client-side hashing
    // We need to add a special header to indicate the password is pre-hashed
    // This ensures Supabase won't hash it again server-side
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      // Only modify Supabase auth endpoints for this specific admin createUser call
      const url = input instanceof Request ? input.url : input.toString();
      const isCreateUserEndpoint = url.includes("/auth/v1/admin/users");

      if (isCreateUserEndpoint && init?.body) {
        // Add the x-password-hashed header
        // This tells Supabase the password is already hashed
        init = {
          ...init,
          headers: {
            ...(init?.headers || {}),
            "x-password-hashed": "true",
          },
        };
      }

      return originalFetch(input, init);
    };

    // Create user in Supabase with email already confirmed
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password: hashedPassword, // This is now pre-hashed
        email_confirm: true,
        user_metadata: {
          firstName,
          lastName,
          role,
        },
        app_metadata: {
          provider: "email",
        },
      });

    // Restore original fetch
    globalThis.fetch = originalFetch;

    if (authError) {
      console.log("error", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Then create the user profile in our database
    const profile = await prisma.profile.create({
      data: {
        userId: authData.user.id,
        firstName,
        lastName,
        role,
        companyId: userCompanyId, // Use the determined company ID
      },
    });

    return NextResponse.json(
      {
        ...profile,
        emailConfirmed: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
