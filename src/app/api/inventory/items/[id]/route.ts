import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schema for updating inventory items
const updateItemSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  categoryId: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  quantity: z.number().int().optional(),
  criticalThreshold: z.number().int().optional(),
  price: z.number().optional().nullable(),
  stockAlerts: z.boolean().optional(),
  companyId: z.string().optional(), // For superadmin use case
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    console.log("GET Item - Profile role:", profile.role); // Debug log
    
    // Build the query based on role
    let itemQuery: any = {
      id: params.id,
    };
    
    // For non-superadmins, restrict to their company
    if (profile.role !== "SUPERADMIN" && profile.companyId) {
      itemQuery.companyId = profile.companyId;
    }

    // Get item with permissions check
    const item = await prisma.inventoryItem.findFirst({
      where: itemQuery,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found or not accessible" },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json({ data: item });
  } catch (error: any) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    console.log("PATCH Item - Profile role:", profile.role); // Debug log

    // First, get the existing item
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Check permission based on role
    if (profile.role !== "SUPERADMIN" && existingItem.companyId !== profile.companyId) {
      return NextResponse.json(
        { error: "You don't have permission to update this item" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    
    try {
      const validatedData = updateItemSchema.parse(body);

      // Determine company context
      let companyId = existingItem.companyId;
      
      // If user is superadmin and explicitly changes the companyId
      if (profile.role === "SUPERADMIN" && validatedData.companyId) {
        // Verify the company exists
        const companyExists = await prisma.company.findUnique({
          where: { id: validatedData.companyId },
        });
        
        if (!companyExists) {
          return NextResponse.json(
            { error: "Company not found" },
            { status: 400 }
          );
        }
        
        companyId = validatedData.companyId;
      }

      // Validate if category exists if provided
      if (validatedData.categoryId) {
        const category = await prisma.inventoryCategory.findUnique({
          where: { id: validatedData.categoryId },
        });

        if (!category) {
          return NextResponse.json(
            { error: "Category not found" },
            { status: 400 }
          );
        }

        // For non-superadmins, ensure category belongs to the same company
        if (profile.role !== "SUPERADMIN" && category.companyId !== companyId) {
          return NextResponse.json(
            { error: "Category does not belong to your company" },
            { status: 403 }
          );
        }
      }

      // Check if quantity is being updated
      const quantityChanged = 
        validatedData.quantity !== undefined && 
        validatedData.quantity !== existingItem.quantity;

      // Start a transaction to update item and create movement record if needed
      const updatedItem = await prisma.$transaction(async (tx) => {
        // Update the item
        const item = await tx.inventoryItem.update({
          where: { id: params.id },
          data: {
            ...validatedData,
            companyId, // Use the determined companyId
            lastStockUpdate: quantityChanged ? new Date() : undefined,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Create stock movement record if quantity is changed
        if (quantityChanged && validatedData.quantity !== undefined) {
          const quantityDiff = validatedData.quantity - existingItem.quantity;
          
          await tx.stockMovement.create({
            data: {
              itemId: item.id,
              quantity: Math.abs(quantityDiff),
              type: quantityDiff > 0 ? "PURCHASE" : "ADJUSTMENT",
              reason: quantityDiff > 0 
                ? "Inventory increase adjustment" 
                : "Inventory decrease adjustment",
              createdBy: profile.id,
            },
          });
        }

        return item;
      });

      // Return success response
      return NextResponse.json({ data: updatedItem });
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
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    console.log("DELETE Item - Profile role:", profile.role); // Debug log

    // Get item to check permissions
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Check permission based on role
    if (profile.role !== "SUPERADMIN" && existingItem.companyId !== profile.companyId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this item" },
        { status: 403 }
      );
    }

    // Check if this item has associated stock movements
    const movementsCount = await prisma.stockMovement.count({
      where: { itemId: params.id },
    });

    // Check if this item has associated order items
    const orderItemsCount = await prisma.posOrderItem.count({
      where: { itemId: params.id },
    });

    // If item has relations, don't allow hard delete
    if (movementsCount > 0 || orderItemsCount > 0) {
      // Instead, soft delete or handle as appropriate for your system
      return NextResponse.json(
        { error: "Cannot delete item with associated records" },
        { status: 400 }
      );
    }

    // Delete the item
    await prisma.inventoryItem.delete({
      where: { id: params.id },
    });

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
} 