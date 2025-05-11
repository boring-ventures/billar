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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    
    // Different query approach based on role
    if (profile.role === "SUPERADMIN") {
      // Superadmins can access any item
      const item = await prisma.inventoryItem.findUnique({
        where: {
          id: (await params).id,
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

      if (!item) {
        return NextResponse.json(
          { error: "Item not found" },
          { status: 404 }
        );
      }

      // Return success response
      return NextResponse.json({ data: item });
    } 
    else if (profile.companyId) {
      // Regular users can only access their company's items
      // Get item with permissions check
      const item = await prisma.inventoryItem.findUnique({
        where: {
          id: (await params).id,
          companyId: profile.companyId,
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

      if (!item) {
        return NextResponse.json(
          { error: "Item not found or not accessible" },
          { status: 404 }
        );
      }

      // Return success response
      return NextResponse.json({ data: item });
    }
    else {
      // Edge case: User without company association
      return NextResponse.json(
        { error: "No company context available for this operation" },
        { status: 400 }
      );
    }
  } catch (error: any) {
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

    // Parse and validate request body
    const body = await req.json();
    
    try {
      const validatedData = updateItemSchema.parse(body);
      
      // Different handling based on user role
      if (profile.role === "SUPERADMIN") {
        // Superadmin can update any item
        // Check if item exists
        const existingItem = await prisma.inventoryItem.findUnique({
          where: { id: (await params).id },
        });

        if (!existingItem) {
          return NextResponse.json(
            { error: "Item not found" },
            { status: 404 }
          );
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
        }

        // Check if company is being changed
        if (validatedData.companyId && validatedData.companyId !== existingItem.companyId) {
          // Verify the company exists
          const companyExists = await prisma.company.findUnique({
            where: { id: validatedData.companyId },
          });
          
          if (!companyExists) {
            return NextResponse.json({ error: "Company not found" }, { status: 400 });
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
            where: { id: (await params).id },
            data: {
              name: validatedData.name,
              categoryId: validatedData.categoryId,
              sku: validatedData.sku,
              quantity: validatedData.quantity,
              criticalThreshold: validatedData.criticalThreshold,
              price: validatedData.price,
              stockAlerts: validatedData.stockAlerts,
              companyId: validatedData.companyId,
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
      }
      else if (profile.companyId) {
        // Regular user - check if item exists and belongs to the user's company
        const existingItem = await prisma.inventoryItem.findUnique({
          where: {
            id: (await params).id,
            companyId: profile.companyId,
          },
        });

        if (!existingItem) {
          return NextResponse.json(
            { error: "Item not found or not accessible" },
            { status: 404 }
          );
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

          if (category.companyId !== profile.companyId) {
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
            where: { id: (await params).id },
            data: {
              name: validatedData.name,
              categoryId: validatedData.categoryId,
              sku: validatedData.sku,
              quantity: validatedData.quantity,
              criticalThreshold: validatedData.criticalThreshold,
              price: validatedData.price,
              stockAlerts: validatedData.stockAlerts,
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
      }
      else {
        // Edge case: User without company association
        return NextResponse.json(
          { error: "No company context available for this operation" },
          { status: 400 }
        );
      }
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

    // Different handling based on user role
    if (profile.role === "SUPERADMIN") {
      // Superadmin can delete any item
      // Check if item exists
      const existingItem = await prisma.inventoryItem.findUnique({
        where: { id: (await params).id },
      });

      if (!existingItem) {
        return NextResponse.json(
          { error: "Item not found" },
          { status: 404 }
        );
      }

      // Check if this item has associated stock movements
      const movementsCount = await prisma.stockMovement.count({
        where: { itemId: (await params).id },
      });

      // Check if this item has associated order items
      const orderItemsCount = await prisma.posOrderItem.count({
        where: { itemId: (await params).id },
      });

      // If there are associated records, prevent deletion
      if (movementsCount > 0 || orderItemsCount > 0) {
        return NextResponse.json(
          { 
            error: "Cannot delete item with associated records",
            details: {
              movementsCount,
              orderItemsCount
            }
          },
          { status: 400 }
        );
      }

      // Delete the item
      await prisma.inventoryItem.delete({
        where: { id: (await params).id },
      });

      // Return success response
      return NextResponse.json({ success: true });
    }
    else if (profile.companyId) {
      // Regular user - check if item exists and belongs to the user's company
      const existingItem = await prisma.inventoryItem.findUnique({
        where: {
          id: (await params).id,
          companyId: profile.companyId,
        },
      });

      if (!existingItem) {
        return NextResponse.json(
          { error: "Item not found or not accessible" },
          { status: 404 }
        );
      }

      // Check if this item has associated stock movements
      const movementsCount = await prisma.stockMovement.count({
        where: { itemId: (await params).id },
      });

      // Check if this item has associated order items
      const orderItemsCount = await prisma.posOrderItem.count({
        where: { itemId: (await params).id },
      });

      // If there are associated records, prevent deletion
      if (movementsCount > 0 || orderItemsCount > 0) {
        return NextResponse.json(
          { 
            error: "Cannot delete item with associated records",
            details: {
              movementsCount,
              orderItemsCount
            }
          },
          { status: 400 }
        );
      }

      // Delete the item
      await prisma.inventoryItem.delete({
        where: { id: (await params).id },
      });

      // Return success response
      return NextResponse.json({ success: true });
    }
    else {
      // Edge case: User without company association
      return NextResponse.json(
        { error: "No company context available for this operation" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
} 