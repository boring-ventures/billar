import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id as string },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { categoryId } = params;
    const body = await req.json();

    // Check if the category exists and belongs to the user's company
    const existingCategory = await prisma.inventoryCategory.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (existingCategory.companyId !== profile.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update category
    const updatedCategory = await prisma.inventoryCategory.update({
      where: { id: categoryId },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        description:
          body.description !== undefined ? body.description : undefined,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id as string },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { categoryId } = params;

    // Check if the category exists and belongs to the user's company
    const existingCategory = await prisma.inventoryCategory.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (existingCategory.companyId !== profile.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if the category has items associated with it
    const itemCount = await prisma.inventoryItem.count({
      where: { categoryId },
    });

    if (itemCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with associated items" },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.inventoryCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
