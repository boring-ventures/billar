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
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    console.log("GET - Profile role:", profile.role); // Debug log
    
    // Initialize where clause based on user role and company
    let whereClause: any = {};
    
    // For SUPERADMIN, show all categories regardless of companyId
    if (profile.role === "SUPERADMIN") {
      // No filter needed - show all categories
      whereClause = {};
    } else if (profile.companyId) {
      // Regular user or admin with company can only see their company's categories
      whereClause = { companyId: profile.companyId };
    } else {
      // User has no company association and is not a superadmin
      return NextResponse.json({ data: [] }); // Return empty array instead of error
    }
    
    // Process search query if provided
    const searchQuery = req.nextUrl.searchParams.get("query");
    if (searchQuery) {
      whereClause = {
        ...whereClause,
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
        ],
      };
    }

    console.log("Using where clause:", JSON.stringify(whereClause)); // Debug log

    // Query database using Prisma
    const categories = await prisma.inventoryCategory.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
    });

    console.log(`Found ${categories.length} categories`); // Debug log

    // Return success response with consistent format
    return NextResponse.json({ data: categories });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
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
    console.log("Profile role:", profile.role); // Debug log

    // Parse and validate request body
    const body = await req.json();
    
    try {
      // Validate the input data
      const validatedData = categorySchema.parse(body);
      
      // Determine which companyId to use
      let companyId: string;
      
      // Case 1: User has a company associated with their profile
      if (profile.companyId) {
        companyId = profile.companyId;
      } 
      // Case 2: User is SUPERADMIN (simplified for testing)
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

      // Create category using Prisma
      const category = await prisma.inventoryCategory.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          companyId: companyId,
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
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
