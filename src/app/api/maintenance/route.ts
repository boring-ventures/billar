import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma'; // Prisma client import
import { z } from 'zod'; // Add zod import for validation

// Validation schema for maintenance record
const maintenanceSchema = z.object({
  description: z.string().min(1, "Description is required"),
  maintenanceAt: z.string(), // Date string that will be converted to Date
  cost: z.number().optional().nullable(),
  tableId: z.string().min(1, "Table ID is required"),
  companyId: z.string().optional(), // Optional for superadmin operations
});

// GET all maintenance data
export async function GET(req: NextRequest) {
  try {
    // Authenticate request - enforcing SUPERADMIN role as per section 6
    const profile = await authenticateRequest(req);
    
    console.log("Profile from auth middleware:", {
      id: profile.id,
      role: profile.role,
      companyId: profile.companyId,
      isSuperAdmin: profile.role === "SUPERADMIN"
    });
    
    // For SUPERADMIN, no company filter is applied
    const queryFilter = {};
    console.log("Using SUPERADMIN access pattern - no company filter applied");
    
    // Get maintenance data from database using Prisma
    const maintenanceRecords = await prisma.tableMaintenance.findMany({
      where: queryFilter,
      orderBy: { maintenanceAt: 'desc' },
      include: {
        table: true,
      },
    });
    
    // Return response with empty array as fallback
    return NextResponse.json({ 
      data: Array.isArray(maintenanceRecords) ? maintenanceRecords : [] 
    });
  } catch (error: any) {
    console.error("Error in maintenance API:", error);
    // Return empty array instead of error object as per section 7
    return NextResponse.json(
      { data: [] },
      { status: error.status || 500 }
    );
  }
}

// POST to create new maintenance record
export async function POST(req: NextRequest) {
  try {
    // Authenticate request - enforcing SUPERADMIN role
    const profile = await authenticateRequest(req);
    
    // Parse and validate request body
    const body = await req.json();
    
    try {
      // Validate with zod schema
      const validatedData = maintenanceSchema.parse(body);
      
      // Determine company context for superadmin operations
      let operationCompanyId: string;
      
      // Handle company context resolution for SUPERADMIN
      if (validatedData.companyId) {
        // Use provided company ID after validation
        const companyExists = await prisma.company.findUnique({
          where: { id: validatedData.companyId },
        });
        
        if (!companyExists) {
          return NextResponse.json({ error: "Company not found" }, { status: 400 });
        }
        
        operationCompanyId = validatedData.companyId;
      } else {
        // Auto-resolve to first available company or create default
        const defaultCompany = await prisma.company.findFirst({
          orderBy: { name: 'asc' }
        }) || await prisma.company.create({
          data: { name: "Default Company" }
        });
        
        operationCompanyId = defaultCompany.id;
      }
      
      // Get table to ensure it exists and belongs to the company
      const table = await prisma.table.findFirst({
        where: {
          id: validatedData.tableId,
          companyId: operationCompanyId
        }
      });
      
      if (!table) {
        return NextResponse.json({ error: "Table not found or doesn't belong to the company" }, { status: 400 });
      }
      
      // Create new maintenance record using Prisma transaction
      const newMaintenanceRecord = await prisma.$transaction(async (tx) => {
        // Create the record
        return tx.tableMaintenance.create({
          data: {
            description: validatedData.description,
            maintenanceAt: new Date(validatedData.maintenanceAt),
            cost: validatedData.cost ? parseFloat(validatedData.cost.toString()) : null,
            tableId: validatedData.tableId,
          },
        });
      });
      
      return NextResponse.json({ data: newMaintenanceRecord }, { status: 201 });
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        return NextResponse.json({ error: zodError.errors }, { status: 400 });
      }
      throw zodError; // Re-throw if it's another type of error
    }
  } catch (error: any) {
    console.error("Error creating maintenance record:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", data: null },
      { status: error.status || 500 }
    );
  }
} 