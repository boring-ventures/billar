import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    
    // Get report type from query params
    const reportType = req.nextUrl.searchParams.get("type") || "stock";
    
    // Different query approach based on role
    if (profile.role === "SUPERADMIN") {
      // Superadmins can access reports across all companies
      
      if (reportType === "stock") {
        // Stock level report
        const stockReport = await prisma.inventoryItem.findMany({
          orderBy: [
            { quantity: "asc" },
            { name: "asc" },
          ],
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        
        return NextResponse.json({ data: stockReport });
      } 
      else if (reportType === "movements") {
        // Stock movements report
        const startDate = req.nextUrl.searchParams.get("startDate") 
          ? new Date(req.nextUrl.searchParams.get("startDate") as string) 
          : new Date(new Date().setDate(new Date().getDate() - 30)); // Last 30 days
          
        const endDate = req.nextUrl.searchParams.get("endDate")
          ? new Date(req.nextUrl.searchParams.get("endDate") as string)
          : new Date();
        
        const movementsReport = await prisma.stockMovement.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            item: {
              select: {
                id: true,
                name: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
        
        return NextResponse.json({ data: movementsReport });
      }
      else if (reportType === "categories") {
        // Categories report
        const categoriesReport = await prisma.inventoryCategory.findMany({
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                items: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        });
        
        return NextResponse.json({ data: categoriesReport });
      }
      else {
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
      }
    } 
    else if (profile.companyId) {
      // Regular users can only access their company's reports
      
      if (reportType === "stock") {
        // Stock level report
        const stockReport = await prisma.inventoryItem.findMany({
          where: {
            companyId: profile.companyId,
          },
          orderBy: [
            { quantity: "asc" },
            { name: "asc" },
          ],
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        
        return NextResponse.json({ data: stockReport });
      } 
      else if (reportType === "movements") {
        // Stock movements report
        const startDate = req.nextUrl.searchParams.get("startDate") 
          ? new Date(req.nextUrl.searchParams.get("startDate") as string) 
          : new Date(new Date().setDate(new Date().getDate() - 30)); // Last 30 days
          
        const endDate = req.nextUrl.searchParams.get("endDate")
          ? new Date(req.nextUrl.searchParams.get("endDate") as string)
          : new Date();
        
        // First, get all the inventory items that belong to the company
        const companyItems = await prisma.inventoryItem.findMany({
          where: {
            companyId: profile.companyId,
          },
          select: {
            id: true,
          },
        });
        
        const companyItemIds = companyItems.map(item => item.id);
        
        const movementsReport = await prisma.stockMovement.findMany({
          where: {
            itemId: {
              in: companyItemIds,
            },
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            item: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        
        return NextResponse.json({ data: movementsReport });
      }
      else if (reportType === "categories") {
        // Categories report
        const categoriesReport = await prisma.inventoryCategory.findMany({
          where: {
            companyId: profile.companyId,
          },
          include: {
            _count: {
              select: {
                items: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        });
        
        return NextResponse.json({ data: categoriesReport });
      }
      else {
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
      }
    } 
    else {
      // Edge case: User without company association
      return NextResponse.json({ data: [] });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
} 