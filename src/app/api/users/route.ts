import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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
    const supabase = createServerComponentClient({ cookies });
    const body = await request.json();
    const { email, password, firstName, lastName, role, companyId } = body;

    // Create user in Supabase with email already confirmed
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Directly mark the email as confirmed
        user_metadata: {
          firstName,
          lastName,
          role,
        },
        app_metadata: {
          provider: "email",
        },
      });

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
        ...(companyId ? { companyId } : {}),
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
