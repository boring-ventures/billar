import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// PATCH /api/inventory-items/[id]/toggle-active - Toggle active status of an inventory item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
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

    // Check if user has permission to modify inventory
    if (currentUserProfile.role === "SELLER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { active } = body;

    if (typeof active !== "boolean") {
      return NextResponse.json(
        { error: "Active status must be a boolean" },
        { status: 400 }
      );
    }

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // For non-superadmins, ensure they can only modify items from their company
    if (
      currentUserProfile.role !== "SUPERADMIN" &&
      existingItem.companyId !== currentUserProfile.companyId
    ) {
      return NextResponse.json(
        { error: "Unauthorized: Cannot modify items from other companies" },
        { status: 403 }
      );
    }

    // Update the item's active status
    interface UpdateData {
      active: boolean;
    }

    const updateData: UpdateData = { active };

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      item: updatedItem,
      message: active
        ? "Item activated successfully"
        : "Item deactivated successfully",
    });
  } catch (error) {
    console.error("Error toggling item active status:", error);
    return NextResponse.json(
      { error: "Failed to toggle item active status" },
      { status: 500 }
    );
  }
}
