import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { z } from "zod";
import { UserRole } from "@prisma/client";

// Validation schema for table creation and updates
const tableSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"]),
  hourlyRate: z.coerce.number().optional().nullable(),
  companyId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate request using middleware
    const profile = await authenticateRequest(req);
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    // Initialize query filter based on role
    let queryFilter: any = {};
    
    // Handle permissions based on role
    const userRole = profile.role.toString();
    
    // Role-based access control pattern
    if (userRole === 'SUPERADMIN') {
      // Superadmins can access all records across companies
      // No company filter needed, leave queryFilter empty
      // If company filter is provided via searchParams, respect it
      if (searchParams.get("companyId")) {
        queryFilter.companyId = searchParams.get("companyId");
      }
    } else if (profile.companyId) {
      // Regular users can only access their company's data
      queryFilter = { companyId: profile.companyId };
    } else {
      // Edge case: User without company association
      return NextResponse.json([]);
    }
    
    // Add search query filter if provided
    if (query) {
      queryFilter = {
        ...queryFilter,
        name: {
          contains: query,
          mode: "insensitive" as const,
        },
      };
    }

    // Execute database query using Prisma
    const tables = await prisma.table.findMany({
      where: queryFilter,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(tables);
  } catch (error: any) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate request using middleware
    const profile = await authenticateRequest(req);
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = tableSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, status, hourlyRate } = validationResult.data;
    
    // Handle permissions based on role
    const userRole = profile.role.toString();
    
    // Determine company context for the operation
    let operationCompanyId: string | undefined;
    
    // Role-based company resolution pattern for operations
    if (userRole === 'SUPERADMIN') {
      // SUPERADMIN special handling:
      // Option 1: Use company ID from request if provided
      if (validationResult.data.companyId) {
        // Verify the company exists
        const companyExists = await prisma.company.findUnique({
          where: { id: validationResult.data.companyId },
        });
        
        if (!companyExists) {
          return NextResponse.json(
            { error: "Company not found" }, 
            { status: 404 }
          );
        }
        
        operationCompanyId = validationResult.data.companyId;
      } 
      // Option 2: Find a suitable default company
      else {
        // Get the first available company or create one if needed
        const defaultCompany = await prisma.company.findFirst({
          orderBy: { name: 'asc' }
        });
        
        if (!defaultCompany) {
          return NextResponse.json(
            { error: "No company available for this operation. Please create a company first." },
            { status: 400 }
          );
        }
        
        operationCompanyId = defaultCompany.id;
      }
    } 
    // Regular users must have a company association
    else if (userRole === 'ADMIN' && profile.companyId) {
      operationCompanyId = profile.companyId;
    } 
    // Non-admin users cannot create tables
    else if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: "You don't have permission to create new tables. Please contact your administrator." },
        { status: 403 }
      );
    }
    // Handle edge case: user without company association
    else {
      return NextResponse.json(
        { error: "No company context available for this operation" },
        { status: 400 }
      );
    }

    // Ensure ADMIN can only create tables for their own company
    if (userRole === 'ADMIN' && 
        validationResult.data.companyId && 
        validationResult.data.companyId !== profile.companyId) {
      return NextResponse.json(
        { error: "Cannot create table for another company" },
        { status: 403 }
      );
    }

    // Create the table with proper company context
    const table = await prisma.table.create({
      data: {
        name,
        status,
        hourlyRate: hourlyRate !== undefined ? hourlyRate : null,
        companyId: operationCompanyId,
      },
    });

    // Create the initial activity log entry
    await prisma.tableActivityLog.create({
      data: {
        tableId: table.id,
        previousStatus: status, // Initial status is both previous and new
        newStatus: status,
        changedById: profile.id,
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error: any) {
    console.error("Error creating table:", error);
    
    // Specific error handling for common cases
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
