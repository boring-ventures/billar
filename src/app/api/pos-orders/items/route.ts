import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// PUT /api/pos-orders/items?id={id} - Update an order item (quantity only)
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
        { error: "Order Item ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Valid quantity is required" },
        { status: 400 }
      );
    }

    // Get the order item
    const orderItem = await prisma.posOrderItem.findUnique({
      where: { id },
      include: {
        order: true,
        item: true,
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: "Order item not found" },
        { status: 404 }
      );
    }

    // Only allow updates if order is not yet paid
    if (orderItem.order.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Cannot update items for a paid order" },
        { status: 400 }
      );
    }

    // Check if we have enough inventory for the new quantity
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: orderItem.itemId },
    });

    if (!inventoryItem) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    // Calculate the net change in quantity
    const quantityDiff = quantity - orderItem.quantity;

    // If increasing quantity, check if we have enough stock
    if (quantityDiff > 0 && inventoryItem.quantity < quantityDiff) {
      return NextResponse.json(
        {
          error: `Not enough stock for item ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Additional needed: ${quantityDiff}`,
        },
        { status: 400 }
      );
    }

    // Use a transaction to update the order item, create a stock movement, and update inventory
    const result = await prisma.$transaction(async (tx) => {
      // Update the order item
      const updatedOrderItem = await tx.posOrderItem.update({
        where: { id },
        data: {
          quantity,
        },
      });

      // Only update inventory if quantity changed
      if (quantityDiff !== 0) {
        // Create a stock movement
        await tx.stockMovement.create({
          data: {
            itemId: orderItem.itemId,
            quantity: -quantityDiff, // Negative for additional items, positive for returned items
            type: quantityDiff > 0 ? "SALE" : "RETURN",
            reason: `Order Item Update: ${orderItem.orderId}`,
            reference: orderItem.orderId,
            createdBy: session.user.id,
          },
        });

        // Update inventory item quantity
        await tx.inventoryItem.update({
          where: { id: orderItem.itemId },
          data: {
            quantity: {
              decrement: quantityDiff, // Decrease for additional items, increase for returned
            },
            lastStockUpdate: new Date(),
          },
        });
      }

      // Recalculate and update the order total
      const orderItems = await tx.posOrderItem.findMany({
        where: { orderId: orderItem.orderId },
      });

      const newTotal = orderItems.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
        0
      );

      await tx.posOrder.update({
        where: { id: orderItem.orderId },
        data: {
          amount: newTotal,
        },
      });

      return { updatedOrderItem, newTotal };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating order item:", error);
    return NextResponse.json(
      { error: "Failed to update order item" },
      { status: 500 }
    );
  }
}

// DELETE /api/pos-orders/items?id={id} - Remove an item from an order
export async function DELETE(request: NextRequest) {
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
        { error: "Order Item ID is required" },
        { status: 400 }
      );
    }

    // Get the order item
    const orderItem = await prisma.posOrderItem.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: "Order item not found" },
        { status: 404 }
      );
    }

    // Only allow removal if order is not yet paid
    if (orderItem.order.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Cannot remove items from a paid order" },
        { status: 400 }
      );
    }

    // Use a transaction to delete the order item, create a stock movement, and update inventory
    const result = await prisma.$transaction(async (tx) => {
      // Create a stock movement to return inventory
      await tx.stockMovement.create({
        data: {
          itemId: orderItem.itemId,
          quantity: orderItem.quantity, // Positive for returned items
          type: "RETURN",
          reason: `Order Item Removed: ${orderItem.orderId}`,
          reference: orderItem.orderId,
          createdBy: session.user.id,
        },
      });

      // Update inventory item quantity
      await tx.inventoryItem.update({
        where: { id: orderItem.itemId },
        data: {
          quantity: {
            increment: orderItem.quantity,
          },
          lastStockUpdate: new Date(),
        },
      });

      // Delete the order item
      await tx.posOrderItem.delete({
        where: { id },
      });

      // Recalculate and update the order total
      const remainingItems = await tx.posOrderItem.findMany({
        where: { orderId: orderItem.orderId },
      });

      const newTotal = remainingItems.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
        0
      );

      await tx.posOrder.update({
        where: { id: orderItem.orderId },
        data: {
          amount: newTotal,
        },
      });

      return { success: true, newTotal, remainingItems };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting order item:", error);
    return NextResponse.json(
      { error: "Failed to delete order item" },
      { status: 500 }
    );
  }
}

// POST /api/pos-orders/items - Add new item to an existing order
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
    const { orderId, itemId, quantity, unitPrice } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Valid quantity is required" },
        { status: 400 }
      );
    }

    if (!unitPrice || unitPrice <= 0) {
      return NextResponse.json(
        { error: "Valid unit price is required" },
        { status: 400 }
      );
    }

    // Check if order exists and is not paid
    const order = await prisma.posOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Cannot add items to a paid order" },
        { status: 400 }
      );
    }

    // Check if inventory item exists and has enough stock
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!inventoryItem) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    if (inventoryItem.quantity < quantity) {
      return NextResponse.json(
        {
          error: `Not enough stock for item ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${quantity}`,
        },
        { status: 400 }
      );
    }

    // Check if this item already exists in the order
    const existingOrderItem = await prisma.posOrderItem.findFirst({
      where: {
        orderId,
        itemId,
      },
    });

    // Use a transaction to create or update the order item, update inventory, and create stock movement
    const result = await prisma.$transaction(async (tx) => {
      let orderItem;

      if (existingOrderItem) {
        // Update the existing order item
        const newQuantity = existingOrderItem.quantity + quantity;
        orderItem = await tx.posOrderItem.update({
          where: { id: existingOrderItem.id },
          data: {
            quantity: newQuantity,
            // Only update unit price if it has changed
            unitPrice:
              unitPrice !== existingOrderItem.unitPrice ? unitPrice : undefined,
          },
        });
      } else {
        // Create a new order item
        orderItem = await tx.posOrderItem.create({
          data: {
            orderId,
            itemId,
            quantity,
            unitPrice,
          },
        });
      }

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          itemId,
          quantity: -quantity, // Negative for sales
          type: "SALE",
          reason: `POS Order: ${orderId}`,
          reference: orderId,
          createdBy: session.user.id,
        },
      });

      // Update inventory item quantity
      await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          quantity: {
            decrement: quantity,
          },
          lastStockUpdate: new Date(),
        },
      });

      // Recalculate and update the order total
      const allOrderItems = await tx.posOrderItem.findMany({
        where: { orderId },
      });

      const newTotal = allOrderItems.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
        0
      );

      await tx.posOrder.update({
        where: { id: orderId },
        data: {
          amount: newTotal,
        },
      });

      return { orderItem, newTotal };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error adding item to order:", error);
    return NextResponse.json(
      { error: "Failed to add item to order" },
      { status: 500 }
    );
  }
}
