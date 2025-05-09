import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET endpoint with enhanced superadmin access pattern for inventory items
export async function GET(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    console.log("GET POS Inventory - Profile role:", profile.role);
    
    // Initialize query filter based on role
    let queryFilter: any = {};
    
    // Enhanced Role-based access control pattern
    if (profile.role === "SUPERADMIN") {
      // Superadmins can access all records across companies
      // Get company filter from query params if provided
      const { searchParams } = new URL(req.url);
      const companyId = searchParams.get('companyId');
      
      if (companyId) {
        // If a specific company is requested by the superadmin
        queryFilter.companyId = companyId;
        console.log("Superadmin filtering by company:", companyId);
      } else {
        // No company filter - will return all items across companies
        console.log("Superadmin accessing all companies' inventory");
      }
    } else if (profile.companyId) {
      // Regular users can only access their company's data
      queryFilter.companyId = profile.companyId;
      console.log("User accessing company inventory:", profile.companyId);
    } else {
      // Edge case: User without company association
      console.log("User has no company association");
      return NextResponse.json({ data: [] });
    }
    
    // Handle query parameters
    const { searchParams } = new URL(req.url);
    
    // Get category filter if provided
    const categoryId = searchParams.get('categoryId');
    if (categoryId) {
      queryFilter.categoryId = categoryId;
    }
    
    // Filter by available stock only if requested
    if (searchParams.get('inStock') === 'true') {
      queryFilter.quantity = {
        gt: 0
      };
    }
    
    // Search by name if provided
    const search = searchParams.get('search');
    if (search) {
      queryFilter.name = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    // Execute database query using Prisma
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: queryFilter,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    
    console.log(`Found ${inventoryItems.length} inventory items matching criteria`);
    
    // Transform the data to match the expected format for the POS interface
    const formattedItems = inventoryItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price ? parseFloat(item.price.toString()) : 0,
      image: null, // Add image URL field if available in your schema
      category: item.category?.name || "Uncategorized",
      sku: item.sku,
      quantity: item.quantity,
      companyId: item.companyId,
      companyName: item.company?.name,
      criticalThreshold: item.criticalThreshold,
      lowStock: item.quantity <= item.criticalThreshold
    }));
    
    // Return inventory items
    return NextResponse.json({ data: formattedItems });
  } catch (error: any) {
    console.error("Error getting inventory items:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
} 