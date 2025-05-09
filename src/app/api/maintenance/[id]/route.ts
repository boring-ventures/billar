import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating maintenance record
const updateMaintenanceSchema = z.object({
  description: z.string().min(1, "Description is required").optional(),
  maintenanceAt: z.string().optional(), // Date string that will be converted
  cost: z.number().nullable().optional(),
  tableId: z.string().min(1, "Table ID is required").optional(),
});

// GET a specific maintenance record
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request - enforcing SUPERADMIN role
    const profile = await authenticateRequest(req);
    
    console.log("Profile from auth middleware:", {
      id: profile.id,
      role: profile.role,
      companyId: profile.companyId,
      isSuperAdmin: profile.role === "SUPERADMIN"
    });
    
    // Get maintenance record using Prisma
    const maintenanceRecord = await prisma.tableMaintenance.findUnique({
      where: { id: params.id },
      include: {
        table: true,
      },
    });
    
    if (!maintenanceRecord) {
      return NextResponse.json(
        { data: null },
        { status: 404 }
      );
    }
    
    // Return response
    return NextResponse.json({ data: maintenanceRecord });
  } catch (error: any) {
    console.error("Error fetching maintenance record:", error);
    // Return null data instead of error object as per section 7
    return NextResponse.json(
      { data: null },
      { status: error.status || 500 }
    );
  }
}

// UPDATE a maintenance record
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request - enforcing SUPERADMIN role
    const profile = await authenticateRequest(req);
    
    // Check if record exists
    const existingRecord = await prisma.tableMaintenance.findUnique({
      where: { id: params.id },
    });
    
    if (!existingRecord) {
      return NextResponse.json(
        { data: null, error: "Maintenance record not found" },
        { status: 404 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    
    try {
      // Validate with zod schema
      const validatedData = updateMaintenanceSchema.parse(body);
      
      // Update maintenance record using Prisma transaction
      const updatedRecord = await prisma.$transaction(async (tx) => {
        return tx.tableMaintenance.update({
          where: { id: params.id },
          data: {
            description: validatedData.description,
            maintenanceAt: validatedData.maintenanceAt ? new Date(validatedData.maintenanceAt) : undefined,
            cost: validatedData.cost !== undefined ? validatedData.cost : undefined,
            tableId: validatedData.tableId,
          },
        });
      });
      
      return NextResponse.json({ data: updatedRecord });
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        return NextResponse.json({ error: zodError.errors }, { status: 400 });
      }
      throw zodError; // Re-throw if it's another type of error
    }
  } catch (error: any) {
    console.error("Error updating maintenance record:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", data: null },
      { status: error.status || 500 }
    );
  }
}

// DELETE a maintenance record
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request - enforcing SUPERADMIN role
    const profile = await authenticateRequest(req);
    
    // Check if record exists
    const existingRecord = await prisma.tableMaintenance.findUnique({
      where: { id: params.id },
    });
    
    if (!existingRecord) {
      return NextResponse.json(
        { error: "Maintenance record not found" },
        { status: 404 }
      );
    }
    
    // Delete the maintenance record using Prisma transaction
    await prisma.$transaction(async (tx) => {
      await tx.tableMaintenance.delete({
        where: { id: params.id },
      });
    });
    
    return NextResponse.json(
      { success: true, message: "Maintenance record deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting maintenance record:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", success: false },
      { status: error.status || 500 }
    );
  }
} 