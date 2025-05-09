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
    console.log("=== Inventory Items GET Request ===");
    
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    
    console.log("Profile from auth middleware:", {
      id: profile.id,
      role: profile.role,
      companyId: profile.companyId,
      isSuperAdmin: profile.role === "SUPERADMIN"
    });
    
    // Initialize query filter - SUPERADMIN implementation only
    // No company filter for superadmin access pattern
    let queryFilter: any = {};
    
    console.log("Using SUPERADMIN access pattern - no company filter applied");

    // Process query parameters
    const searchQuery = req.nextUrl.searchParams.get("query");
    const lowStock = req.nextUrl.searchParams.get("lowStock") === "true";
    const categoryId = req.nextUrl.searchParams.get("categoryId");

    // Add additional filters based on query parameters
    if (searchQuery) {
      queryFilter = {
        ...queryFilter,
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { sku: { contains: searchQuery, mode: "insensitive" } },
        ],
      };
    }

    if (lowStock) {
      queryFilter = {
        ...queryFilter,
        quantity: {
          lte: prisma.inventoryItem.fields.criticalThreshold,
        },
      };
    }

    if (categoryId) {
      queryFilter = {
        ...queryFilter,
        categoryId,
      };
    }

    console.log("Final query filter:", JSON.stringify(queryFilter));

    // Check database contents first to verify data exists
    const totalItems = await prisma.inventoryItem.count();
    console.log(`Total items in database: ${totalItems}`);

    // Query database using Prisma
    const items = await prisma.inventoryItem.findMany({
      where: queryFilter,
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

    console.log(`Found ${items.length} items matching the filter`);
    
    // Return success response
    return NextResponse.json({ data: items });
  } catch (error: any) {
    console.error("Error in inventory items GET:", error);
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
      const validatedData = itemSchema.parse(body);
      
      // Determine company context for superadmin operation
      let operationCompanyId: string;
      
      // Handle superadmin company context resolution
      if (validatedData.companyId) {
        // Verify the company exists
        const companyExists = await prisma.company.findUnique({
          where: { id: validatedData.companyId },
        });
        
        if (!companyExists) {
          return NextResponse.json({ error: "Company not found" }, { status: 400 });
        }
        
        operationCompanyId = validatedData.companyId;
      } else {
        // Get the first available company or create one if needed
        const defaultCompany = await prisma.company.findFirst({
          orderBy: { name: 'asc' }
        }) || await prisma.company.create({
          data: { name: "Default Company" }
        });
        
        operationCompanyId = defaultCompany.id;
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
        
        // No company restriction check needed for superadmin
      }

      // Create item using Prisma
      const item = await prisma.inventoryItem.create({
        data: {
          name: validatedData.name,
          categoryId: validatedData.categoryId,
          sku: validatedData.sku,
          quantity: validatedData.quantity,
          criticalThreshold: validatedData.criticalThreshold,
          price: validatedData.price,
          stockAlerts: validatedData.stockAlerts,
          companyId: operationCompanyId,
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
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
