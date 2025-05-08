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
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    console.log("GET Stock Movements - Profile role:", profile.role); // Debug log
    
    // Process query parameters
    const itemId = req.nextUrl.searchParams.get("itemId");
    const type = req.nextUrl.searchParams.get("type") as MovementType | null;
    
    // Initialize query for movements
    let movementWhereClause: any = {};
    
    // For SUPERADMIN, show all movements across companies
    if (profile.role === "SUPERADMIN") {
      // Add filters if provided but don't restrict by company
      if (itemId) {
        movementWhereClause.itemId = itemId;
      }
      if (type) {
        movementWhereClause.type = type;
      }
    } else if (profile.companyId) {
      // Regular user with company - get all company items first
      const companyItems = await prisma.inventoryItem.findMany({
        where: {
          companyId: profile.companyId,
        },
        select: {
          id: true,
        },
      });
      
      const companyItemIds = companyItems.map(item => item.id);
      
      // Restrict movements to company items
      movementWhereClause = {
        itemId: {
          in: companyItemIds,
        },
        ...(itemId ? { itemId } : {}),
        ...(type ? { type } : {}),
      };
    } else {
      // User has no company association and is not a superadmin
      return NextResponse.json({ data: [] }); // Return empty array instead of error
    }
    
    console.log("Using where clause:", JSON.stringify(movementWhereClause)); // Debug log
    
    // Query database for movements based on role-appropriate filters
    const movements = await prisma.stockMovement.findMany({
      where: movementWhereClause,
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
    
    console.log(`Found ${movements.length} stock movements`); // Debug log

    // Return success response
    return NextResponse.json({ data: movements });
  } catch (error: any) {
    console.error("Error fetching stock movements:", error);
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
    console.log("POST Stock Movement - Profile role:", profile.role); // Debug log

    // Parse and validate request body
    const body = await req.json();
    
    try {
      const validatedData = stockMovementSchema.parse(body);

      // Validate that the item exists
      const item = await prisma.inventoryItem.findUnique({
        where: {
          id: validatedData.itemId,
        },
      });

      if (!item) {
        return NextResponse.json(
          { error: "Item not found" },
          { status: 404 }
        );
      }

      // Check if user has access to this item
      if (profile.role !== "SUPERADMIN" && profile.companyId !== item.companyId) {
        return NextResponse.json(
          { error: "You don't have permission to modify this item" },
          { status: 403 }
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
            ...validatedData,
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
    console.error("Error creating stock movement:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
