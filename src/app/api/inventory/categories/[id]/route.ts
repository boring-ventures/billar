import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schema for updating categories
const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);

    // Find the category
    const category = await prisma.inventoryCategory.findUnique({
      where: { id: (await params).id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check permissions - superadmin can see all, others only their company's
    if (
      profile.role !== "SUPERADMIN" &&
      (!profile.companyId || category.companyId !== profile.companyId)
    ) {
      return NextResponse.json(
        { error: "You don't have permission to access this category" },
        { status: 403 }
      );
    }

    // Return success response
    return NextResponse.json({ data: category });
  } catch (error: any) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);

    // Find the category to check permissions
    const category = await prisma.inventoryCategory.findUnique({
      where: { id: (await params).id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check permissions - superadmin can modify all, others only their company's
    if (
      profile.role !== "SUPERADMIN" &&
      (!profile.companyId || category.companyId !== profile.companyId)
    ) {
      return NextResponse.json(
        { error: "You don't have permission to update this category" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    
    try {
      const validatedData = updateCategorySchema.parse(body);

      // Update the category
      const updatedCategory = await prisma.inventoryCategory.update({
        where: { id: (await params).id },
        data: validatedData,
      });

      // Return success response
      return NextResponse.json({ data: updatedCategory });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error: any) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);

    // Find the category to check permissions
    const category = await prisma.inventoryCategory.findUnique({
      where: { id: (await params).id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check permissions - superadmin can delete all, others only their company's
    if (
      profile.role !== "SUPERADMIN" &&
      (!profile.companyId || category.companyId !== profile.companyId)
    ) {
      return NextResponse.json(
        { error: "You don't have permission to delete this category" },
        { status: 403 }
      );
    }

    // Check if this category has associated inventory items
    const itemsCount = await prisma.inventoryItem.count({
      where: { categoryId: (await params).id },
    });

    // For items using this category, update them to have no category
    if (itemsCount > 0) {
      await prisma.inventoryItem.updateMany({
        where: { categoryId: (await params).id },
        data: { categoryId: null },
      });
    }

    // Delete the category
    await prisma.inventoryCategory.delete({
      where: { id: (await params).id },
    });

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
} 