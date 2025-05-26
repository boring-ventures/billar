import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";

// GET /api/inventory-items - Get all inventory items
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const requestedCompanyId = searchParams.get("companyId");
    const categoryId = searchParams.get("categoryId");
    const lowStock = searchParams.get("lowStock");
    const itemType = searchParams.get("itemType");

    // Configure where clause based on provided filters and user role
    const whereClause: Prisma.InventoryItemWhereInput = {};

    // If the user is a SUPERADMIN, they can access all items
    // If the user is an ADMIN or SELLER, they can only access items from their company
    if (currentUserProfile.role !== "SUPERADMIN") {
      // Non-superadmins can only access items from their own company
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

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (itemType) {
      whereClause.itemType = itemType as "SALE" | "INTERNAL_USE";
    }

    if (lowStock === "true") {
      whereClause.quantity = {
        lte: prisma.inventoryItem.fields.criticalThreshold,
      };
    }

    const items = await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory items" },
      { status: 500 }
    );
  }
}

// POST /api/inventory-items - Create a new inventory item
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

    // Get the current user's profile to check permissions
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        company: true,
      },
    });

    if (!currentUserProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    console.log("User profile:", {
      id: currentUserProfile.id,
      role: currentUserProfile.role,
      companyId: currentUserProfile.companyId,
      hasCompany: !!currentUserProfile.company,
    });

    const body = await request.json();
    const {
      name,
      companyId: requestedCompanyId,
      categoryId,
      sku,
      quantity,
      price,
      criticalThreshold,
      stockAlerts,
      createInitialMovement,
      initialCostPrice,
      itemType,
    } = body;
    let companyId = requestedCompanyId;

    console.log("Request body:", {
      name,
      companyId,
      categoryId,
      sku,
      quantity,
      price,
      criticalThreshold,
      stockAlerts,
    });

    // Determine the company ID to use
    // If not a superadmin, force the company ID to be the current user's company
    if (currentUserProfile.role !== "SUPERADMIN") {
      if (!currentUserProfile.companyId) {
        console.log("Error: User has no company association");
        return NextResponse.json(
          {
            error: "Cannot create item: You are not associated with a company",
          },
          { status: 403 }
        );
      }

      // Override any provided company ID with the user's company ID
      companyId = currentUserProfile.companyId;
      console.log(`Using user's company ID: ${companyId}`);
    } else if (!companyId) {
      // For superadmins, companyId is still required
      console.log("Error: SUPERADMIN provided no company ID");
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!name) {
      console.log("Error: Name is missing");
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      console.log(`Error: Company not found with ID ${companyId}`);
      return NextResponse.json(
        {
          error: `Company not found with ID ${companyId}`,
        },
        { status: 404 }
      );
    }

    // If categoryId is provided, check if it exists and belongs to the same company
    if (categoryId) {
      const category = await prisma.inventoryCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        console.log(`Error: Category not found with ID ${categoryId}`);
        return NextResponse.json(
          { error: `Category not found with ID ${categoryId}` },
          { status: 404 }
        );
      }

      // Make sure the category belongs to the same company
      if (category.companyId !== companyId) {
        console.log(
          `Error: Category (${categoryId}) belongs to company ${category.companyId}, not ${companyId}`
        );
        return NextResponse.json(
          { error: "Category does not belong to the specified company" },
          { status: 400 }
        );
      }
    }

    // If SKU is provided, check if it's unique
    if (sku) {
      const existingItem = await prisma.inventoryItem.findUnique({
        where: { sku },
      });

      if (existingItem) {
        console.log(`Error: Item with SKU ${sku} already exists`);
        return NextResponse.json(
          { error: `An item with SKU '${sku}' already exists` },
          { status: 400 }
        );
      }
    }

    console.log("Creating item with data:", {
      name,
      companyId,
      categoryId: categoryId && categoryId.trim() !== "" ? categoryId : null,
      sku: sku && sku.trim() !== "" ? sku : null,
      quantity: quantity || 0,
      price: price !== undefined && price !== null ? price : null,
      criticalThreshold: criticalThreshold || 5,
      stockAlerts,
    });

    // Create inventory item
    const item = await prisma.inventoryItem.create({
      data: {
        name,
        companyId,
        categoryId: categoryId && categoryId.trim() !== "" ? categoryId : null,
        sku: sku && sku.trim() !== "" ? sku : null,
        quantity: quantity || 0,
        price: price !== undefined && price !== null ? price : null,
        criticalThreshold: criticalThreshold || 5,
        stockAlerts: stockAlerts !== undefined ? stockAlerts : true,
        itemType: (itemType as "SALE" | "INTERNAL_USE") || "SALE",
        lastStockUpdate: new Date(),
      },
    });

    console.log("Item created successfully:", item.id);

    // Create initial stock movement if quantity > 0 and createInitialMovement is not false
    if (quantity > 0 && createInitialMovement !== false) {
      // Get the staff profile ID from the user ID
      const staffProfile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          quantity,
          type: "PURCHASE",
          reason: "Initial stock",
          costPrice: initialCostPrice !== undefined ? initialCostPrice : null,
          createdBy: staffProfile?.id || null,
        },
      });
      console.log(
        `Created initial stock movement for ${quantity} units with cost price: ${initialCostPrice || "N/A"}`
      );
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create inventory item",
      },
      { status: 500 }
    );
  }
}

// PUT /api/inventory-items?id={id} - Update an inventory item
export async function PUT(request: NextRequest) {
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
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, categoryId, sku, price, criticalThreshold, stockAlerts } =
      body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // If categoryId is provided, check if it exists
    if (categoryId) {
      const category = await prisma.inventoryCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    // If SKU is changed, check if it's unique
    if (sku && sku !== existingItem.sku) {
      const itemWithSku = await prisma.inventoryItem.findUnique({
        where: { sku },
      });

      if (itemWithSku) {
        return NextResponse.json(
          { error: "An item with this SKU already exists" },
          { status: 400 }
        );
      }
    }

    // Update the item
    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name,
        categoryId: categoryId || undefined,
        sku: sku || undefined,
        price: price || undefined,
        criticalThreshold: criticalThreshold || undefined,
        stockAlerts: stockAlerts !== undefined ? stockAlerts : undefined,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory-items?id={id} - Delete an inventory item
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
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Check if item exists
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        posOrderItems: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check if item is used in orders
    if (item.posOrderItems.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete item with associated orders" },
        { status: 400 }
      );
    }

    // Delete related stock movements first
    await prisma.stockMovement.deleteMany({
      where: { itemId: id },
    });

    // Delete the item
    await prisma.inventoryItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    );
  }
}
