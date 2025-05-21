import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Helper function to check user permissions
async function checkUserPermissions(userId: string, targetProfileId: string) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { allowed: false, error: "Unauthorized", status: 401 };
  }

  // Get the current user's profile to check permissions
  const currentUserProfile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  if (!currentUserProfile) {
    return { allowed: false, error: "User profile not found", status: 404 };
  }

  // Get the target profile
  const targetProfile = await prisma.profile.findUnique({
    where: { id: targetProfileId },
  });

  if (!targetProfile) {
    return { allowed: false, error: "Target user not found", status: 404 };
  }

  // Allow if user is a SUPERADMIN
  if (currentUserProfile.role === "SUPERADMIN") {
    return { allowed: true, currentUserProfile };
  }

  // Allow if user is trying to access their own profile
  if (currentUserProfile.id === targetProfileId) {
    return { allowed: true, currentUserProfile };
  }

  // Allow if user is an ADMIN and the target user is from the same company
  if (
    currentUserProfile.role === "ADMIN" &&
    currentUserProfile.companyId === targetProfile.companyId
  ) {
    return { allowed: true, currentUserProfile };
  }

  // Otherwise, deny access
  return {
    allowed: false,
    error: "Unauthorized to access this user",
    status: 403,
    currentUserProfile,
  };
}

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profileId = (await params).id;

    // Check permissions
    const { allowed, error, status } = await checkUserPermissions(
      "",
      profileId
    );

    if (!allowed) {
      return NextResponse.json({ error }, { status });
    }

    const user = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { company: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update a user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profileId = (await params).id;
    const body = await request.json();
    const { firstName, lastName, role, active } = body;

    // Check permissions
    const { allowed, error, status, currentUserProfile } =
      await checkUserPermissions("", profileId);

    if (!allowed) {
      return NextResponse.json({ error }, { status });
    }

    // Additional validation: non-superadmins cannot set SUPERADMIN role
    if (role === "SUPERADMIN" && currentUserProfile!.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "You are not authorized to assign SUPERADMIN role" },
        { status: 403 }
      );
    }

    // Prevent users from changing their own role
    const isEditingSelf = currentUserProfile!.id === profileId;
    if (isEditingSelf && role && role !== currentUserProfile!.role) {
      return NextResponse.json(
        { error: "No puedes cambiar tu propio rol" },
        { status: 403 }
      );
    }

    // Prevent users from changing their own active status
    if (
      isEditingSelf &&
      active !== undefined &&
      active !== currentUserProfile!.active
    ) {
      return NextResponse.json(
        { error: "No puedes cambiar el estado de tu propia cuenta" },
        { status: 403 }
      );
    }

    // Only update the fields we allow - never allow company ID to change
    const user = await prisma.profile.update({
      where: { id: profileId },
      data: {
        firstName,
        lastName,
        // Only allow changing role if not editing self and user is allowed
        ...(role && !isEditingSelf ? { role } : {}),
        // Only allow changing active status if not editing self
        ...(active !== undefined && !isEditingSelf ? { active } : {}),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profileId = (await params).id;

    // Get current session
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user's profile
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentUserProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get the target profile
    const targetProfile = await prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent users from deleting their own account
    if (currentUserProfile.id === profileId) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta de usuario" },
        { status: 403 }
      );
    }

    // Check permissions
    const { allowed, error, status } = await checkUserPermissions(
      "",
      profileId
    );

    if (!allowed) {
      return NextResponse.json({ error }, { status });
    }

    // Delete the profile from our database
    await prisma.profile.delete({
      where: { id: profileId },
    });

    // Delete the user from Supabase Auth
    await supabase.auth.admin.deleteUser(targetProfile.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
