import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schema for inventory categories
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  companyId: z.string().optional(), // For superadmin use case
});

export async function GET(req: NextRequest) {
  try {
    console.log("=== Inventory Categories GET Request ===");
    
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    
    console.log("Profile from auth middleware:", {
      id: profile.id,
      role: profile.role,
      companyId: profile.companyId,
      isSuperAdmin: profile.role === "SUPERADMIN"
    });
    
    // Initialize query filter based on role
    let queryFilter: any = {};
    
    // Role-based access control pattern
    if (profile.role === "SUPERADMIN") {
      // Superadmins can access all records across companies
      console.log("User is SUPERADMIN - no company filter applied");
      queryFilter = {}; // No company filter
    } else if (profile.companyId) {
      // Regular users can only access their company's data
      console.log("Regular user - filtering by company:", profile.companyId);
      queryFilter = { companyId: profile.companyId };
    } else {
      // Edge case: User without company association
      console.log("User has no company association - returning empty array");
      return NextResponse.json({ data: [] });
    }
    
    // Process search query if provided
    const searchQuery = req.nextUrl.searchParams.get("query");
    if (searchQuery) {
      queryFilter = {
        ...queryFilter,
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
        ],
      };
    }

    console.log("Final query filter:", JSON.stringify(queryFilter));

    // Check database contents first to verify data exists
    const totalCategories = await prisma.inventoryCategory.count();
    console.log(`Total categories in database: ${totalCategories}`);

    // Query database using Prisma
    const categories = await prisma.inventoryCategory.findMany({
      where: queryFilter,
      orderBy: { name: "asc" },
    });

    console.log(`Found ${categories.length} categories matching the filter`);

    // Return success response with consistent format
    return NextResponse.json({ data: categories });
  } catch (error: any) {
    console.error("Error in inventory categories GET:", error);
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
      // Validate the input data
      const validatedData = categorySchema.parse(body);
      
      // Determine company context for the operation
      let operationCompanyId: string;
      
      // Company resolution pattern
      if (profile.companyId) {
        // Use the user's assigned company
        operationCompanyId = profile.companyId;
      } 
      // Superadmin special handling
      else if (profile.role === "SUPERADMIN") {
        // Option 1: Use company ID from request if provided
        if (validatedData.companyId) {
          // Verify the company exists
          const companyExists = await prisma.company.findUnique({
            where: { id: validatedData.companyId },
          });
          
          if (!companyExists) {
            return NextResponse.json({ error: "Company not found" }, { status: 400 });
          }
          
          operationCompanyId = validatedData.companyId;
        } 
        // Option 2: Find a suitable default company
        else {
          // Get the first available company or create one if needed
          const defaultCompany = await prisma.company.findFirst({
            orderBy: { name: 'asc' }
          }) || await prisma.company.create({
            data: { name: "Default Company" }
          });
          
          operationCompanyId = defaultCompany.id;
        }
      }
      // Handle edge case
      else {
        return NextResponse.json(
          { error: "No company context available for this operation" },
          { status: 400 }
        );
      }

      // Create category using Prisma
      const category = await prisma.inventoryCategory.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          companyId: operationCompanyId,
        },
      });

      // Return success response with consistent format
      return NextResponse.json({ data: category }, { status: 201 });
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
