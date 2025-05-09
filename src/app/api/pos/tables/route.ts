import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET endpoint with enhanced superadmin access pattern for tables
export async function GET(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    console.log("GET POS Tables - Using SUPERADMIN access pattern");
    
    // Initialize query filter based on role
    let queryFilter: any = {};
    
    // No company filter - will return all tables across companies
    console.log("Superadmin accessing all companies' tables");
    
    // Handle query parameters
    const { searchParams } = new URL(req.url);
    
    // Apply company filter if provided (superadmin can filter by company)
    const companyId = searchParams.get('companyId');
    if (companyId) {
      queryFilter.companyId = companyId;
      console.log("Filtering tables by company:", companyId);
    }
    
    // Filter by table status if provided
    const status = searchParams.get('status');
    if (status) {
      queryFilter.status = status;
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
    const tables = await prisma.table.findMany({
      where: queryFilter,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { name: 'asc' },
    });
    
    console.log(`Found ${tables.length} tables matching criteria`);
    
    // Fetch active sessions for these tables
    const tableIds = tables.map(table => table.id);
    const activeSessions = await prisma.tableSession.findMany({
      where: {
        tableId: { in: tableIds },
        status: "ACTIVE"
      },
      include: {
        posOrders: {
          select: {
            id: true,
          }
        }
      },
      orderBy: {
        startedAt: "desc"
      }
    });
    
    console.log(`Found ${activeSessions.length} active sessions for the tables`);
    
    // Create a map of tableId to session
    const sessionMap = new Map();
    activeSessions.forEach(session => {
      if (!sessionMap.has(session.tableId)) {
        sessionMap.set(session.tableId, session);
      }
    });
    
    // Transform the data to match the expected format for the POS interface
    const formattedTables = tables.map(table => {
      // Determine table status
      const activeSession = sessionMap.get(table.id);
      let tableStatus: "available" | "occupied" | "reserved" | "maintenance" = "available";
      
      if (activeSession) {
        tableStatus = "occupied";
      } else if (table.status === "RESERVED") {
        tableStatus = "reserved";
      } else if (table.status === "MAINTENANCE") {
        tableStatus = "maintenance"; 
      }
      
      return {
        id: table.id,
        number: table.name,
        status: tableStatus,
        hourlyRate: table.hourlyRate ? parseFloat(table.hourlyRate.toString()) : 0,
        companyId: table.companyId,
        companyName: table.company?.name,
        currentSession: activeSession ? {
          id: activeSession.id,
          startTime: activeSession.startedAt.toISOString(),
          endTime: activeSession.endedAt?.toISOString(),
          orderCount: activeSession.posOrders.length,
          totalTime: activeSession.endedAt 
            ? Math.floor((activeSession.endedAt.getTime() - activeSession.startedAt.getTime()) / 60000)
            : Math.floor((Date.now() - activeSession.startedAt.getTime()) / 60000),
          totalCost: activeSession.totalCost 
            ? parseFloat(activeSession.totalCost.toString())
            : null
        } : undefined
      };
    });
    
    // Return tables
    return NextResponse.json({ data: formattedTables });
  } catch (error: any) {
    console.error("Error getting tables:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
} 