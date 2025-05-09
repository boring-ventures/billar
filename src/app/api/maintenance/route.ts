import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma'; // Corrected Prisma client import

// GET all maintenance data
export async function GET(req: NextRequest) {
  try {
    // Authenticate request
    const user = await authenticateRequest(req);
    
    // For SUPERADMIN, no company filter is applied
    // Following section 6 of Logic Tasks.txt for SUPERADMIN-only implementation
    const queryFilter = {};
    console.log("Using SUPERADMIN access pattern - no company filter applied");
    
    // Get maintenance data from database
    const maintenanceRecords = await prisma.tableMaintenance.findMany({
      where: queryFilter,
      orderBy: { maintenanceAt: 'desc' },
      include: {
        table: true,
      },
    });
    
    // Return response
    return NextResponse.json({ data: maintenanceRecords });
  } catch (error: any) {
    console.error("Error in maintenance API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", data: [] },
      { status: error.status || 500 }
    );
  }
}

// POST to create new maintenance record
export async function POST(req: NextRequest) {
  try {
    // Authenticate request
    const user = await authenticateRequest(req);
    
    // Parse and validate request body
    const body = await req.json();
    
    // Determine company context for superadmin operations
    let operationCompanyId: string;
    
    // Handle company context resolution for SUPERADMIN
    if (body.companyId) {
      // Use provided company ID after validation
      const companyExists = await prisma.company.findUnique({
        where: { id: body.companyId },
      });
      
      if (!companyExists) {
        return NextResponse.json({ error: "Company not found" }, { status: 400 });
      }
      
      operationCompanyId = body.companyId;
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
        id: body.tableId,
        companyId: operationCompanyId
      }
    });
    
    if (!table) {
      return NextResponse.json({ error: "Table not found or doesn't belong to the company" }, { status: 400 });
    }
    
    // Create new maintenance record
    const newMaintenanceRecord = await prisma.tableMaintenance.create({
      data: {
        description: body.description,
        maintenanceAt: new Date(body.maintenanceAt),
        cost: body.cost ? parseFloat(body.cost) : null,
        tableId: body.tableId,
      },
    });
    
    return NextResponse.json({ data: newMaintenanceRecord }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating maintenance record:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
} 