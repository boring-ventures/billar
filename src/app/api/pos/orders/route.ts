import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// Schema for order item validation
const orderItemSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

// Schema for order validation
const orderSchema = z.object({
  tableSessionId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["CASH", "CARD", "MOBILE", "OTHER"]),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]),
  companyId: z.string().uuid().optional(), // Optional for superadmin
  orderItems: z.array(orderItemSchema).min(1),
});

// GET endpoint with superadmin access pattern
export async function GET(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    console.log("GET POS Orders - Profile role:", profile.role); // Debug log
    
    // Initialize query filter based on role
    let queryFilter: any = {};
    
    // Role-based access control pattern
    if (profile.role === "SUPERADMIN") {
      // Superadmins can access all records across companies
      queryFilter = {}; // No company filter
    } else if (profile.companyId) {
      // Regular users can only access their company's data
      queryFilter = { companyId: profile.companyId };
    } else {
      // Edge case: User without company association
      return NextResponse.json({ data: [] });
    }
    
    // Handle query parameters
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const skip = (page - 1) * limit;
    
    // Get table session ID if provided
    const tableSessionId = searchParams.get('tableSessionId');
    if (tableSessionId) {
      queryFilter.tableSessionId = tableSessionId;
    }
    
    // Add any additional filters from request parameters
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      queryFilter.createdAt = {
        ...(queryFilter.createdAt || {}),
        gte: new Date(dateFrom),
      };
    }
    
    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      queryFilter.createdAt = {
        ...(queryFilter.createdAt || {}),
        lte: new Date(dateTo),
      };
    }
    
    const paymentStatus = searchParams.get('paymentStatus');
    if (paymentStatus) {
      queryFilter.paymentStatus = paymentStatus;
    }
    
    // Execute database query using Prisma
    const [orders, total] = await Promise.all([
      prisma.posOrder.findMany({
        where: queryFilter,
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
          tableSession: {
            select: {
              id: true,
              startedAt: true,
              endedAt: true,
              table: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.posOrder.count({ where: queryFilter }),
    ]);
    
    // Return with pagination metadata
    return NextResponse.json({
      data: orders,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error getting orders:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

// POST endpoint with enhanced superadmin privileges
export async function POST(req: NextRequest) {
  try {
    // Authenticate request using the middleware
    const profile = await authenticateRequest(req);
    console.log("POST POS Order - Profile role:", profile.role); // Debug log
    
    // Parse and validate request body
    const body = await req.json();
    
    try {
      const validatedData = orderSchema.parse(body);
      
      // Determine company context for the operation
      let operationCompanyId: string;
      
      // Enhanced company resolution pattern for superadmins
      if (profile.role === "SUPERADMIN") {
        // Superadmin can specify any company
        if (validatedData.companyId) {
          // Verify the company exists
          const companyExists = await prisma.company.findUnique({
            where: { id: validatedData.companyId },
          });
          
          if (!companyExists) {
            return NextResponse.json({ 
              error: "Company not found with ID: " + validatedData.companyId 
            }, { status: 400 });
          }
          
          operationCompanyId = validatedData.companyId;
          console.log("Superadmin creating order for company:", operationCompanyId);
        } 
        // Use superadmin's company if assigned
        else if (profile.companyId) {
          operationCompanyId = profile.companyId;
          console.log("Superadmin using their assigned company:", operationCompanyId);
        }
        // Find a default company
        else {
          // Get the first available company
          const defaultCompany = await prisma.company.findFirst({
            orderBy: { name: 'asc' }
          });
          
          if (!defaultCompany) {
            return NextResponse.json(
              { error: "No company available. Please create a company first or specify a company ID" },
              { status: 400 }
            );
          }
          
          operationCompanyId = defaultCompany.id;
          console.log("Superadmin using default company:", operationCompanyId);
        }
      }
      // Regular user must use their assigned company
      else if (profile.companyId) {
        operationCompanyId = profile.companyId;
        console.log("Regular user creating order for their company:", operationCompanyId);
        
        // Ensure regular users can't override their company
        if (validatedData.companyId && validatedData.companyId !== profile.companyId) {
          return NextResponse.json(
            { error: "You can only create orders for your assigned company" },
            { status: 403 }
          );
        }
      }
      // Handle edge case - no company context
      else {
        return NextResponse.json(
          { error: "No company context available for this operation" },
          { status: 400 }
        );
      }
      
      // Verify item existence, ownership and stock availability
      for (const item of validatedData.orderItems) {
        const inventoryItem = await prisma.inventoryItem.findUnique({
          where: { id: item.itemId },
        });
        
        if (!inventoryItem) {
          return NextResponse.json(
            { error: `Item with ID ${item.itemId} not found` },
            { status: 400 }
          );
        }
        
        // Check if the item belongs to the operation company
        if (inventoryItem.companyId !== operationCompanyId) {
          // Allow cross-company item access only for superadmins
          if (profile.role !== "SUPERADMIN") {
            return NextResponse.json(
              { error: `Item with ID ${item.itemId} belongs to a different company` },
              { status: 400 }
            );
          } else {
            console.log("Superadmin accessing item from different company:", inventoryItem.companyId);
            // We'll allow superadmin to use items from other companies, but log it
          }
        }
        
        // Check stock availability
        if (inventoryItem.quantity < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for item: ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}` },
            { status: 400 }
          );
        }
      }
      
      // Create the order with transaction to handle stock updates
      const result = await prisma.$transaction(async (tx: any) => {
        // Create the order with the determined company context
        const order = await tx.posOrder.create({
          data: {
            companyId: operationCompanyId,
            staffId: validatedData.staffId,
            tableSessionId: validatedData.tableSessionId,
            amount: validatedData.amount,
            paymentMethod: validatedData.paymentMethod,
            paymentStatus: validatedData.paymentStatus,
            orderItems: {
              create: validatedData.orderItems.map(item => ({
                itemId: item.itemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              })),
            },
          },
          include: {
            orderItems: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
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
        
        console.log(`Created order ${order.id} for company ${operationCompanyId}`);
        
        // Update inventory for each item
        for (const item of validatedData.orderItems) {
          await tx.inventoryItem.update({
            where: { id: item.itemId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
              lastStockUpdate: new Date(),
            },
          });
          
          // Create stock movement record
          await tx.stockMovement.create({
            data: {
              itemId: item.itemId,
              quantity: item.quantity,
              type: "SALE",
              reason: `POS Sale - Order #${order.id}`,
              createdBy: profile.id,
            },
          });
          
          console.log(`Updated inventory for item ${item.itemId}, decremented ${item.quantity} units`);
        }
        
        return order;
      });
      
      return NextResponse.json({ data: result }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 });
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
} 