import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Expense entry validation schema
const expenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  expenseType: z.enum(['INVENTORY', 'MAINTENANCE', 'STAFF', 'UTILITY', 'OTHER']),
  date: z.date().or(z.string()),
  companyId: z.string().uuid().optional(),
});

// GET endpoint for retrieving expense data (from financial reports) with superadmin access pattern
export async function GET(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    
    // Initialize query filter based on role
    let queryFilter: any = {};
    
    // Role-based access control pattern
    if (profile.role === "SUPERADMIN") {
      // Superadmins can access all expense records across companies
      queryFilter = {}; // No company filter
    } else if (profile.companyId) {
      // Regular users can only access their company's expense data
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
        inventoryCost: true,
        maintenanceCost: true,
        staffCost: true,
        utilityCost: true,
        otherExpenses: true,
        totalExpense: true,
        companyId: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });
    
    // Transform report data to focus on expenses
    const expenseData = reports.map(report => ({
      id: report.id,
      reportName: report.name,
      reportType: report.reportType,
      period: {
        startDate: report.startDate,
        endDate: report.endDate
      },
      inventoryCost: report.inventoryCost,
      maintenanceCost: report.maintenanceCost,
      staffCost: report.staffCost,
      utilityCost: report.utilityCost,
      otherExpenses: report.otherExpenses,
      totalExpense: report.totalExpense,
      companyId: report.companyId,
      companyName: report.company?.name
    }));
    
    return NextResponse.json({ data: expenseData });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

// POST endpoint for updating expenses in reports with superadmin access pattern
export async function POST(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    
    // Parse and validate request body
    const body = await req.json();
    const validatedData = expenseSchema.parse(body);
    
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
    
    // Determine which expense field to update based on type
    let updateData: any = {};
    switch (validatedData.expenseType) {
      case 'INVENTORY':
        updateData.inventoryCost = { increment: validatedData.amount };
        break;
      case 'MAINTENANCE':
        updateData.maintenanceCost = { increment: validatedData.amount };
        break;
      case 'STAFF':
        updateData.staffCost = { increment: validatedData.amount };
        break;
      case 'UTILITY':
        updateData.utilityCost = { increment: validatedData.amount };
        break;
      case 'OTHER':
        updateData.otherExpenses = { increment: validatedData.amount };
        break;
    }
    
    // Also update the totals
    updateData.totalExpense = { increment: validatedData.amount };
    updateData.netProfit = { decrement: validatedData.amount }; // Expenses reduce profit
    
    // Either update existing report or create a new one
    if (report) {
      // Update existing report
      report = await prisma.financialReport.update({
        where: { id: report.id },
        data: updateData
      });
    } else {
      // Create new daily report
      const baseExpenses = {
        inventoryCost: 0,
        maintenanceCost: 0,
        staffCost: 0,
        utilityCost: 0,
        otherExpenses: 0
      };
      
      switch (validatedData.expenseType) {
        case 'INVENTORY':
          baseExpenses.inventoryCost = validatedData.amount;
          break;
        case 'MAINTENANCE':
          baseExpenses.maintenanceCost = validatedData.amount;
          break;
        case 'STAFF':
          baseExpenses.staffCost = validatedData.amount;
          break;
        case 'UTILITY':
          baseExpenses.utilityCost = validatedData.amount;
          break;
        case 'OTHER':
          baseExpenses.otherExpenses = validatedData.amount;
          break;
      }
      
      const totalExpense = baseExpenses.inventoryCost + baseExpenses.maintenanceCost + 
                          baseExpenses.staffCost + baseExpenses.utilityCost + 
                          baseExpenses.otherExpenses;
      
      report = await prisma.financialReport.create({
        data: {
          companyId: operationCompanyId,
          name: `Daily Report - ${date.toISOString().split('T')[0]}`,
          reportType: 'DAILY',
          startDate: startOfDay,
          endDate: endOfDay,
          salesIncome: 0,
          tableRentIncome: 0,
          otherIncome: 0,
          totalIncome: 0,
          inventoryCost: baseExpenses.inventoryCost,
          maintenanceCost: baseExpenses.maintenanceCost,
          staffCost: baseExpenses.staffCost,
          utilityCost: baseExpenses.utilityCost,
          otherExpenses: baseExpenses.otherExpenses,
          totalExpense: totalExpense,
          netProfit: -totalExpense, // Negative profit since only expenses
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