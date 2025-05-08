import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schema for inventory items
const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  quantity: z.number().int().default(0),
  criticalThreshold: z.number().int().default(5),
  price: z.number().optional().nullable(),
  stockAlerts: z.boolean().default(true),
  companyId: z.string().optional(), // For superadmin use case
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    console.log("GET Items - Profile role:", profile.role); // Debug log
    
    // Initialize where clause based on user role and company
    let whereClause: any = {};
    
    // For SUPERADMIN, show all items regardless of companyId
    if (profile.role === "SUPERADMIN") {
      // No filter needed - show all categories
      whereClause = {};
    } else if (profile.companyId) {
      // Regular user or admin with company can only see their company's items
      whereClause = { companyId: profile.companyId };
    } else {
      // User has no company association and is not a superadmin
      return NextResponse.json({ data: [] }); // Return empty array instead of error
    }

    // Process query parameters
    const searchQuery = req.nextUrl.searchParams.get("query");
    const lowStock = req.nextUrl.searchParams.get("lowStock") === "true";
    const categoryId = req.nextUrl.searchParams.get("categoryId");

    // Add additional filters
    if (searchQuery) {
      whereClause = {
        ...whereClause,
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { sku: { contains: searchQuery, mode: "insensitive" } },
        ],
      };
    }

    if (lowStock) {
      whereClause = {
        ...whereClause,
        quantity: {
          lte: prisma.inventoryItem.fields.criticalThreshold,
        },
      };
    }

    if (categoryId) {
      whereClause = {
        ...whereClause,
        categoryId,
      };
    }

    console.log("Using where clause:", JSON.stringify(whereClause)); // Debug log

    // Query database using Prisma
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
      orderBy: { name: "asc" },
    });

    console.log(`Found ${items.length} items`); // Debug log

    // Return success response
    return NextResponse.json({ data: items });
  } catch (error: any) {
    console.error("Error fetching items:", error);
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
    console.log("POST Item - Profile role:", profile.role); // Debug log

    // Parse and validate request body
    const body = await req.json();
    
    try {
      const validatedData = itemSchema.parse(body);
      
      // Determine which companyId to use
      let companyId: string;
      
      // Case 1: User has a company associated with their profile
      if (profile.companyId) {
        companyId = profile.companyId;
      } 
      // Case 2: User is SUPERADMIN
      else if (profile.role === "SUPERADMIN") {
        console.log("Superadmin detected"); // Debug log
        
        // Get or create a default company
        let defaultCompany = await prisma.company.findFirst({
          orderBy: { name: 'asc' }
        });
        
        if (!defaultCompany) {
          console.log("Creating default company"); // Debug log
          defaultCompany = await prisma.company.create({
            data: {
              name: "Default Company",
            }
          });
        }
        
        companyId = defaultCompany.id;
      }
      // Case 3: No company available
      else {
        return NextResponse.json(
          { error: "No company associated with profile. Please specify a companyId." },
          { status: 400 }
        );
      }
      
      console.log("Using company ID:", companyId); // Debug log

      // Validate if category exists if provided and belongs to the company
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

        // For non-superadmins, check if category belongs to the company
        if (profile.role !== "SUPERADMIN" && category.companyId !== companyId) {
          return NextResponse.json(
            { error: "Category does not belong to your company" },
            { status: 403 }
          );
        }
      }

      // Create item using Prisma
      const item = await prisma.inventoryItem.create({
        data: {
          ...validatedData,
          companyId: companyId,
          lastStockUpdate: new Date(),
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

      // Create initial stock movement record
      if (validatedData.quantity > 0) {
        await prisma.stockMovement.create({
          data: {
            itemId: item.id,
            quantity: validatedData.quantity,
            type: "PURCHASE",
            reason: "Initial stock",
            createdBy: profile.id,
          },
        });
      }

      // Return success response
      return NextResponse.json({ data: item }, { status: 201 });
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
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
