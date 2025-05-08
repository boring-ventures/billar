import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Income entry validation schema
const incomeSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  incomeType: z.enum(['SALES', 'TABLE_RENT', 'OTHER']),
  date: z.date().or(z.string()),
  companyId: z.string().uuid().optional(),
});

// GET endpoint for retrieving income data (from financial reports) with superadmin access pattern
export async function GET(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    
    // Initialize query filter based on role
    let queryFilter: any = {};
    
    // Role-based access control pattern
    if (profile.role === "SUPERADMIN") {
      // Superadmins can access all income records across companies
      queryFilter = {}; // No company filter
    } else if (profile.companyId) {
      // Regular users can only access their company's income data
      queryFilter = { companyId: profile.companyId };
    } else {
      // Edge case: User without company association
      return NextResponse.json({ data: [] });
    }
    
    // Get query parameters for additional filtering
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Add filters if provided
    if (startDate && endDate) {
      queryFilter.startDate = {
        gte: new Date(startDate),
      };
      queryFilter.endDate = {
        lte: new Date(endDate),
      };
    }
    
    // Execute database query using Prisma to get financial reports
    const reports = await prisma.financialReport.findMany({
      where: queryFilter,
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        reportType: true,
        startDate: true,
        endDate: true,
        salesIncome: true,
        tableRentIncome: true,
        otherIncome: true,
        totalIncome: true,
        companyId: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });
    
    // Transform report data to focus on income
    const incomeData = reports.map(report => ({
      id: report.id,
      reportName: report.name,
      reportType: report.reportType,
      period: {
        startDate: report.startDate,
        endDate: report.endDate
      },
      salesIncome: report.salesIncome,
      tableRentIncome: report.tableRentIncome,
      otherIncome: report.otherIncome,
      totalIncome: report.totalIncome,
      companyId: report.companyId,
      companyName: report.company?.name
    }));
    
    return NextResponse.json({ data: incomeData });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

// POST endpoint for updating income in reports with superadmin access pattern
export async function POST(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    
    // Parse and validate request body
    const body = await req.json();
    const validatedData = incomeSchema.parse(body);
    
    // Determine company context for the operation
    let operationCompanyId: string;
    
    // Company resolution pattern
    if (profile.role === "SUPERADMIN" && validatedData.companyId) {
      // Superadmin can specify a company
      const companyExists = await prisma.company.findUnique({
        where: { id: validatedData.companyId },
      });
      
      if (!companyExists) {
        return NextResponse.json({ error: "Company not found" }, { status: 400 });
      }
      
      operationCompanyId = validatedData.companyId;
    } else if (profile.companyId) {
      // Use the user's assigned company
      operationCompanyId = profile.companyId;
    } else {
      return NextResponse.json(
        { error: "No company context available for this operation" },
        { status: 400 }
      );
    }
    
    const date = new Date(validatedData.date);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    
    // Look for an existing daily report for this date
    let report = await prisma.financialReport.findFirst({
      where: {
        companyId: operationCompanyId,
        reportType: 'DAILY',
        startDate: {
          gte: startOfDay
        },
        endDate: {
          lte: endOfDay
        }
      }
    });
    
    // Determine which income field to update based on type
    let updateData: any = {};
    switch (validatedData.incomeType) {
      case 'SALES':
        updateData.salesIncome = { increment: validatedData.amount };
        break;
      case 'TABLE_RENT':
        updateData.tableRentIncome = { increment: validatedData.amount };
        break;
      case 'OTHER':
        updateData.otherIncome = { increment: validatedData.amount };
        break;
    }
    
    // Also update the total
    updateData.totalIncome = { increment: validatedData.amount };
    updateData.netProfit = { increment: validatedData.amount };
    
    // Either update existing report or create a new one
    if (report) {
      // Update existing report
      report = await prisma.financialReport.update({
        where: { id: report.id },
        data: updateData
      });
    } else {
      // Create new daily report
      const baseIncome = {
        salesIncome: 0,
        tableRentIncome: 0,
        otherIncome: 0
      };
      
      switch (validatedData.incomeType) {
        case 'SALES':
          baseIncome.salesIncome = validatedData.amount;
          break;
        case 'TABLE_RENT':
          baseIncome.tableRentIncome = validatedData.amount;
          break;
        case 'OTHER':
          baseIncome.otherIncome = validatedData.amount;
          break;
      }
      
      const totalIncome = baseIncome.salesIncome + baseIncome.tableRentIncome + baseIncome.otherIncome;
      
      report = await prisma.financialReport.create({
        data: {
          companyId: operationCompanyId,
          name: `Daily Report - ${date.toISOString().split('T')[0]}`,
          reportType: 'DAILY',
          startDate: startOfDay,
          endDate: endOfDay,
          salesIncome: baseIncome.salesIncome,
          tableRentIncome: baseIncome.tableRentIncome,
          otherIncome: baseIncome.otherIncome,
          totalIncome: totalIncome,
          inventoryCost: 0,
          maintenanceCost: 0,
          staffCost: 0,
          utilityCost: 0,
          otherExpenses: 0,
          totalExpense: 0,
          netProfit: totalIncome,
          generatedById: profile.id,
        }
      });
    }
    
    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error: any) {
    // Error handling pattern
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
} 