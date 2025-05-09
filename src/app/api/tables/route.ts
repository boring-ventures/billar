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
    
    // Force SUPERADMIN role for all authenticated users
    console.log("Using SUPERADMIN access pattern - no company filter applied");
    
    // If company filter is provided via searchParams, respect it
    if (searchParams.get("companyId")) {
      queryFilter.companyId = searchParams.get("companyId");
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
    let operationCompanyId: string;

    // Handle superadmin company context resolution
    if (validationResult.data.companyId) {
      // Use provided company ID after validation
      const companyExists = await prisma.company.findUnique({
        where: { id: validationResult.data.companyId },
      });
      
      if (!companyExists) {
        return NextResponse.json({ error: "Company not found" }, { status: 400 });
      }
      
      operationCompanyId = validationResult.data.companyId;
    } else {
      // Auto-resolve to first available company or create default
      const defaultCompany = await prisma.company.findFirst({
        orderBy: { name: 'asc' }
      }) || await prisma.company.create({
        data: { name: "Default Company" }
      });
      
      operationCompanyId = defaultCompany.id;
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
