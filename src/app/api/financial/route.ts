import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET endpoint for retrieving financial data with superadmin access pattern
export async function GET(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    
    // Initialize query filter based on role
    let queryFilter: any = {};
    
    // Role-based access control pattern
    if (profile.role === "SUPERADMIN") {
      // Superadmins can access all financial records across companies
      queryFilter = {}; // No company filter
    } else if (profile.companyId) {
      // Regular users can only access their company's financial data
      queryFilter = { companyId: profile.companyId };
    } else {
      // Edge case: User without company association
      return NextResponse.json({ data: [] });
    }
    
    // Get query parameters for additional filtering
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Add date range filter if provided
    if (startDate && endDate) {
      queryFilter.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    // Execute database query using Prisma
    const reports = await prisma.financialReport.findMany({
      where: queryFilter,
      orderBy: { generatedAt: 'desc' },
    });
    
    return NextResponse.json({ data: reports });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
} 