import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

// GET /api/pos-orders/[id] - Get a specific POS order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await prisma.posOrder.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
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
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching POS order:", error);
    return NextResponse.json(
      { error: "Failed to fetch POS order" },
      { status: 500 }
    );
  }
}

// PATCH /api/pos-orders/[id] - Update specific fields of a POS order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

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

    // Update fields that are provided
    const updateData: {
      paymentStatus?: PaymentStatus;
      paymentMethod?: PaymentMethod;
    } = {};

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus as PaymentStatus;
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod as PaymentMethod;
    }

    // Only update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.posOrder.update({
      where: { id },
      data: updateData,
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

// DELETE /api/pos-orders/[id] - Delete a POS order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get the order with its items
    const order = await prisma.posOrder.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow deletion if the order is unpaid
    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Cannot delete a paid order" },
        { status: 400 }
      );
    }

    // Use a transaction to handle deletion and inventory updates
    await prisma.$transaction(async (tx) => {
      // For each item in the order, create a reversing stock movement
      // and update the inventory
      for (const orderItem of order.orderItems) {
        // Create a stock movement to restore inventory
        await tx.stockMovement.create({
          data: {
            itemId: orderItem.itemId,
            quantity: orderItem.quantity, // Positive to add back to inventory
            type: "RETURN",
            reason: `Order Cancelled: ${order.id}`,
            reference: order.id,
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
      }

      // Delete order items first (due to foreign key constraints)
      await tx.posOrderItem.deleteMany({
        where: { orderId: id },
      });

      // Delete the order
      await tx.posOrder.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting POS order:", error);
    return NextResponse.json(
      { error: "Failed to delete POS order" },
      { status: 500 }
    );
  }
}
