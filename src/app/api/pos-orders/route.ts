import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";

// GET /api/pos-orders - Get all pos orders
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");
    const tableSessionId = searchParams.get("tableSessionId");
    const paymentStatus = searchParams.get("paymentStatus");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Add pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = (page - 1) * limit;

    // Configure where clause based on provided filters
    const whereClause: Prisma.PosOrderWhereInput = {};

    if (companyId) {
      whereClause.companyId = companyId;
    }

    if (tableSessionId) {
      whereClause.tableSessionId = tableSessionId;
    }

    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus as PaymentStatus;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};

      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom);
      }

      if (dateTo) {
        whereClause.createdAt.lte = new Date(dateTo);
      }
    }

    // Get total count for pagination info
    const totalCount = await prisma.posOrder.count({
      where: whereClause,
    });

    const orders = await prisma.posOrder.findMany({
      where: whereClause,
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
            totalCost: true,
            table: {
              select: {
                id: true,
                name: true,
                hourlyRate: true,
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
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Return with pagination metadata
    return NextResponse.json({
      data: orders,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching POS orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch POS orders" },
      { status: 500 }
    );
  }
}

// POST /api/pos-orders - Create a new POS order
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, tableSessionId, paymentMethod, paymentStatus, items } =
      body;

    // Validate required fields
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // If tableSessionId is provided, check if it exists and retrieve its data
    let tableSession = null;
    if (tableSessionId) {
      tableSession = await prisma.tableSession.findUnique({
        where: { id: tableSessionId },
        include: {
          table: true, // Include table to get hourly rate
        },
      });

      if (!tableSession) {
        return NextResponse.json(
          { error: "Table session not found" },
          { status: 404 }
        );
      }
    }

    // Validate items and check inventory
    const itemIds = items.map((item: { itemId: string }) => item.itemId);
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        id: {
          in: itemIds,
        },
      },
    });

    // Create a map for quick lookups
    const inventoryItemMap = new Map(
      inventoryItems.map((item) => [item.id, item])
    );

    // Validate each item
    for (const item of items) {
      const inventoryItem = inventoryItemMap.get(item.itemId);

      if (!inventoryItem) {
        return NextResponse.json(
          { error: `Item with ID ${item.itemId} not found` },
          { status: 404 }
        );
      }

      if (item.quantity <= 0) {
        return NextResponse.json(
          {
            error: `Quantity must be greater than 0 for item ${inventoryItem.name}`,
          },
          { status: 400 }
        );
      }

      if (inventoryItem.quantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Not enough stock for item ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`,
          },
          { status: 400 }
        );
      }

      if (!item.unitPrice || item.unitPrice <= 0) {
        return NextResponse.json(
          { error: `Unit price is required for item ${inventoryItem.name}` },
          { status: 400 }
        );
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    );

    // Use a transaction to create the order, order items, and update inventory
    const result = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.posOrder.create({
        data: {
          companyId,
          staffId: session.user.id,
          tableSessionId: tableSessionId || undefined,
          amount: totalAmount,
          paymentMethod: paymentMethod || "CASH",
          paymentStatus: paymentStatus || "UNPAID",
        },
        include: {
          tableSession: {
            select: {
              id: true,
              startedAt: true,
              endedAt: true,
              totalCost: true,
              table: {
                select: {
                  id: true,
                  name: true,
                  hourlyRate: true,
                },
              },
            },
          },
        },
      });

      // Create order items and update inventory
      const orderItems = [];
      const stockMovements = [];

      for (const item of items) {
        // Create order item
        const orderItem = await tx.posOrderItem.create({
          data: {
            orderId: order.id,
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          },
        });

        orderItems.push(orderItem);

        // Create stock movement (negative quantity for sales)
        const stockMovement = await tx.stockMovement.create({
          data: {
            itemId: item.itemId,
            quantity: -item.quantity, // Negative for sales
            type: "SALE",
            reason: `POS Order: ${order.id}`,
            reference: order.id,
            createdBy: session.user.id,
          },
        });

        stockMovements.push(stockMovement);

        // Update inventory item quantity
        await tx.inventoryItem.update({
          where: { id: item.itemId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
            lastStockUpdate: new Date(),
          },
        });
      }

      return { order, orderItems, stockMovements };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating POS order:", error);
    return NextResponse.json(
      { error: "Failed to create POS order" },
      { status: 500 }
    );
  }
}

// PUT /api/pos-orders?id={id} - Update a POS order (payment status, payment method)
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { paymentStatus, paymentMethod } = body;

    // Check if order exists
    const order = await prisma.posOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update the order
    const updatedOrder = await prisma.posOrder.update({
      where: { id },
      data: {
        paymentStatus: paymentStatus || undefined,
        paymentMethod: (paymentMethod as PaymentMethod) || undefined,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating POS order:", error);
    return NextResponse.json(
      { error: "Failed to update POS order" },
      { status: 500 }
    );
  }
}
