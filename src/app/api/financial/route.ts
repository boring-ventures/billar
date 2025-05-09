import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for financial data validation
const financialFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  companyId: z.string().optional(),
}).optional();

// GET endpoint for retrieving financial data with superadmin access pattern
export async function GET(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    
    console.log("Financial API - Profile from auth middleware:", {
      id: profile.id,
      role: profile.role,
      companyId: profile.companyId,
      isSuperAdmin: profile.role === "SUPERADMIN"
    });
    
    // Initialize query filter based on role
    let queryFilter: any = {};
    
    // Role-based access control pattern - always using SUPERADMIN in current phase
    if (profile.role === "SUPERADMIN") {
      // Superadmins can access all financial records across companies
      console.log("Using SUPERADMIN access pattern - no company filter applied");
      queryFilter = {}; // No company filter
    } else if (profile.companyId) {
      // Regular users can only access their company's financial data
      queryFilter = { companyId: profile.companyId };
    } else {
      // Edge case: User without company association - return empty default
      return NextResponse.json({ 
        data: {
          totalIncome: 0,
          totalExpenses: 0,
          netProfit: 0,
          activeTables: 0,
          incomeCategories: [],
          expenseCategories: [],
          recentIncome: [],
          recentExpenses: []
        } 
      });
    }
    
    // Get query parameters for additional filtering
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Add date range filter if provided
    if (startDate && endDate) {
      queryFilter.startDate = {
        gte: new Date(startDate),
      };
      queryFilter.endDate = {
        lte: new Date(endDate),
      };
    }
    
    // Execute database queries using Prisma to get financial reports
    const reports = await prisma.financialReport.findMany({
      where: queryFilter,
      orderBy: { generatedAt: 'desc' },
      take: 10,
      include: {
        company: {
          select: {
            name: true
          }
        }
      }
    });
    
    // Count active tables
    const activeTables = await prisma.table.count({
      where: {
        ...queryFilter,
        status: 'OCCUPIED'
      }
    });
    
    // Calculate totals from the reports
    const totalIncome = reports.reduce((sum: number, report: any) => sum + Number(report.totalIncome), 0);
    const totalExpenses = reports.reduce((sum: number, report: any) => sum + Number(report.totalExpense), 0);
    const netProfit = reports.reduce((sum: number, report: any) => sum + Number(report.netProfit), 0);
    
    // Get income categories from reports
    const incomeCategories = [
      {
        id: "1",
        name: "Sales Income",
        total: reports.reduce((sum: number, report: any) => sum + Number(report.salesIncome), 0),
        percentage: 0  // Will calculate below
      },
      {
        id: "2",
        name: "Table Rent",
        total: reports.reduce((sum: number, report: any) => sum + Number(report.tableRentIncome), 0),
        percentage: 0  // Will calculate below
      },
      {
        id: "3",
        name: "Other Income",
        total: reports.reduce((sum: number, report: any) => sum + Number(report.otherIncome), 0),
        percentage: 0  // Will calculate below
      }
    ];
    
    // Calculate percentages for income categories
    if (totalIncome > 0) {
      incomeCategories.forEach(category => {
        category.percentage = Math.round((category.total / totalIncome) * 100);
      });
    }
    
    // Get expense categories from reports
    const expenseCategories = [
      {
        id: "1",
        name: "Inventory",
        total: reports.reduce((sum: number, report: any) => sum + Number(report.inventoryCost), 0),
        percentage: 0  // Will calculate below
      },
      {
        id: "2",
        name: "Maintenance",
        total: reports.reduce((sum: number, report: any) => sum + Number(report.maintenanceCost), 0),
        percentage: 0  // Will calculate below
      },
      {
        id: "3",
        name: "Staff",
        total: reports.reduce((sum: number, report: any) => sum + Number(report.staffCost), 0),
        percentage: 0  // Will calculate below
      },
      {
        id: "4",
        name: "Utilities",
        total: reports.reduce((sum: number, report: any) => sum + Number(report.utilityCost), 0),
        percentage: 0  // Will calculate below
      },
      {
        id: "5",
        name: "Other",
        total: reports.reduce((sum: number, report: any) => sum + Number(report.otherExpenses), 0),
        percentage: 0  // Will calculate below
      }
    ];
    
    // Calculate percentages for expense categories
    if (totalExpenses > 0) {
      expenseCategories.forEach(category => {
        category.percentage = Math.round((category.total / totalExpenses) * 100);
      });
    }
    
    // Transform reports for recent income and expenses
    const recentIncome = reports.map(report => ({
      id: report.id,
      date: report.endDate.toISOString().split('T')[0],
      category: "Daily Income",
      description: report.name,
      amount: Number(report.totalIncome),
      status: "Completed"
    }));
    
    const recentExpenses = reports.map(report => ({
      id: report.id,
      date: report.endDate.toISOString().split('T')[0],
      category: "Daily Expenses",
      description: report.name,
      amount: Number(report.totalExpense),
      status: "Paid"
    }));
    
    // Return formatted financial data
    return NextResponse.json({
      data: {
        totalIncome,
        totalExpenses,
        netProfit,
        activeTables,
        incomeCategories,
        expenseCategories,
        recentIncome,
        recentExpenses
      }
    });
  } catch (error: any) {
    console.error('Financial API error:', error);
    // Return empty default data structure for error cases
    return NextResponse.json({
      data: {
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        activeTables: 0,
        incomeCategories: [],
        expenseCategories: [],
        recentIncome: [],
        recentExpenses: []
      },
      error: error.message || "Internal server error"
    }, { status: error.status || 500 });
  }
} 