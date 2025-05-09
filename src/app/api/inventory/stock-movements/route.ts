import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { MovementType } from "@prisma/client";

// Validation schema for stock movements
const stockMovementSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().positive(),
  type: z.enum([
    "PURCHASE",
    "SALE",
    "ADJUSTMENT",
    "RETURN",
    "TRANSFER",
  ] as const),
  costPrice: z.number().optional().nullable(),
  reason: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  companyId: z.string().optional(), // For superadmin use case
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    
    // Process query parameters
    const itemId = req.nextUrl.searchParams.get("itemId");
    const type = req.nextUrl.searchParams.get("type") as MovementType | null;
    
    // Different query approach based on role
    if (profile.role === "SUPERADMIN") {
      // Superadmins can see all movements across companies
      const movements = await prisma.stockMovement.findMany({
        where: {
          ...(itemId ? { itemId } : {}),
          ...(type ? { type } : {}),
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      
      return NextResponse.json({ data: movements });
    } 
    else if (profile.companyId) {
      // Regular users can only see movements for their company's items
      
      // First, get all the inventory items that belong to the company
      const companyItems = await prisma.inventoryItem.findMany({
        where: {
          companyId: profile.companyId,
        },
        select: {
          id: true,
        },
      });

      const companyItemIds = companyItems.map(item => item.id);

      // Query database for movements for items that belong to the company
      const movements = await prisma.stockMovement.findMany({
        where: {
          itemId: {
            in: companyItemIds,
          },
          ...(itemId ? { itemId } : {}),
          ...(type ? { type } : {}),
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Return success response
      return NextResponse.json({ data: movements });
    } 
    else {
      // Edge case: User without company association
      return NextResponse.json({ data: [] });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);

    // Parse and validate request body
    const body = await req.json();
    
    try {
      const validatedData = stockMovementSchema.parse(body);

      // Different handling based on user role
      if (profile.role === "SUPERADMIN") {
        // Superadmin can create movements for any item
        // Verify the item exists
        const item = await prisma.inventoryItem.findUnique({
          where: { id: validatedData.itemId },
        });

        if (!item) {
          return NextResponse.json(
            { error: "Item not found" },
            { status: 404 }
          );
        }

        // Calculate new quantity based on movement type
        let newQuantity = item.quantity;
        
        switch (validatedData.type) {
          case "PURCHASE":
          case "RETURN":
            newQuantity += validatedData.quantity;
            break;
          case "SALE":
          case "TRANSFER":
            // Prevent quantity from going negative
            if (item.quantity < validatedData.quantity) {
              return NextResponse.json(
                { error: "Insufficient stock available" },
                { status: 400 }
              );
            }
            newQuantity -= validatedData.quantity;
            break;
          case "ADJUSTMENT":
            // For adjustments, verify if it would make the quantity negative
            if (validatedData.reason?.includes("decrease") && item.quantity < validatedData.quantity) {
              return NextResponse.json(
                { error: "Adjustment would result in negative stock" },
                { status: 400 }
              );
            } else if (validatedData.reason?.includes("decrease")) {
              newQuantity -= validatedData.quantity;
            } else {
              newQuantity += validatedData.quantity;
            }
            break;
        }

        // Use a transaction to update both the movement and item quantity
        const result = await prisma.$transaction(async (tx) => {
          // Create the stock movement
          const movement = await tx.stockMovement.create({
            data: {
              itemId: validatedData.itemId,
              quantity: validatedData.quantity,
              type: validatedData.type,
              costPrice: validatedData.costPrice,
              reason: validatedData.reason,
              reference: validatedData.reference,
              createdBy: profile.id,
            },
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          // Update the item quantity
          await tx.inventoryItem.update({
            where: { id: validatedData.itemId },
            data: {
              quantity: newQuantity,
              lastStockUpdate: new Date(),
            },
          });

          return movement;
        });

        // Return success response
        return NextResponse.json({ data: result }, { status: 201 });
      } 
      else if (profile.companyId) {
        // Regular user - validate that the item exists and belongs to the user's company
        const item = await prisma.inventoryItem.findFirst({
          where: {
            id: validatedData.itemId,
            companyId: profile.companyId,
          },
        });

        if (!item) {
          return NextResponse.json(
            { error: "Item not found or not accessible" },
            { status: 404 }
          );
        }

        // Calculate new quantity based on movement type
        let newQuantity = item.quantity;
        
        switch (validatedData.type) {
          case "PURCHASE":
          case "RETURN":
            newQuantity += validatedData.quantity;
            break;
          case "SALE":
          case "TRANSFER":
            // Prevent quantity from going negative
            if (item.quantity < validatedData.quantity) {
              return NextResponse.json(
                { error: "Insufficient stock available" },
                { status: 400 }
              );
            }
            newQuantity -= validatedData.quantity;
            break;
          case "ADJUSTMENT":
            // For adjustments, verify if it would make the quantity negative
            if (validatedData.reason?.includes("decrease") && item.quantity < validatedData.quantity) {
              return NextResponse.json(
                { error: "Adjustment would result in negative stock" },
                { status: 400 }
              );
            } else if (validatedData.reason?.includes("decrease")) {
              newQuantity -= validatedData.quantity;
            } else {
              newQuantity += validatedData.quantity;
            }
            break;
        }

        // Use a transaction to update both the movement and item quantity
        const result = await prisma.$transaction(async (tx) => {
          // Create the stock movement
          const movement = await tx.stockMovement.create({
            data: {
              itemId: validatedData.itemId,
              quantity: validatedData.quantity,
              type: validatedData.type,
              costPrice: validatedData.costPrice,
              reason: validatedData.reason,
              reference: validatedData.reference,
              createdBy: profile.id,
            },
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          // Update the item quantity
          await tx.inventoryItem.update({
            where: { id: validatedData.itemId },
            data: {
              quantity: newQuantity,
              lastStockUpdate: new Date(),
            },
          });

          return movement;
        });

        // Return success response
        return NextResponse.json({ data: result }, { status: 201 });
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
