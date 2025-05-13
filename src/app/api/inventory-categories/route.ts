import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET /api/inventory-categories - Get all inventory categories
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");

    // Configure where clause based on whether companyId is provided
    const whereClause = companyId ? { companyId } : {};

    const categories = await prisma.inventoryCategory.findMany({
      where: whereClause,
      include: {
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching inventory categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory categories" },
      { status: 500 }
    );
  }
}

// POST /api/inventory-categories - Create a new inventory category
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, companyId } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Create the inventory category
    const category = await prisma.inventoryCategory.create({
      data: {
        name,
        description,
        companyId,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory category:", error);
    return NextResponse.json(
      { error: "Failed to create inventory category" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory-categories?id={id} - Delete an inventory category
export async function DELETE(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.inventoryCategory.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if category has items
    if (category.items.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with associated items" },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.inventoryCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory category:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory category" },
      { status: 500 }
    );
  }
}
