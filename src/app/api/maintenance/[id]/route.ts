import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET a specific maintenance record
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request
    const user = await authenticateRequest(req);
    
    // Get maintenance record
    const maintenanceRecord = await prisma.tableMaintenance.findUnique({
      where: { id: params.id },
      include: {
        table: true,
      },
    });
    
    if (!maintenanceRecord) {
      return NextResponse.json(
        { error: "Maintenance record not found" },
        { status: 404 }
      );
    }
    
    // Return response
    return NextResponse.json({ data: maintenanceRecord });
  } catch (error: any) {
    console.error("Error fetching maintenance record:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
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
    // Authenticate request
    const user = await authenticateRequest(req);
    
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
    
    // Parse and validate request body
    const body = await req.json();
    
    // Update maintenance record
    const updatedRecord = await prisma.tableMaintenance.update({
      where: { id: params.id },
      data: {
        description: body.description !== undefined ? body.description : undefined,
        maintenanceAt: body.maintenanceAt ? new Date(body.maintenanceAt) : undefined,
        cost: body.cost !== undefined ? parseFloat(body.cost) : undefined,
        tableId: body.tableId !== undefined ? body.tableId : undefined,
      },
    });
    
    return NextResponse.json({ data: updatedRecord });
  } catch (error: any) {
    console.error("Error updating maintenance record:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
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
    // Authenticate request
    const user = await authenticateRequest(req);
    
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
    
    // Delete the maintenance record
    await prisma.tableMaintenance.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json(
      { message: "Maintenance record deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting maintenance record:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
} 