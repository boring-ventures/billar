import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";

// Define interfaces
interface OrderItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
  isTrackedItem?: boolean;
}

// GET /api/pos-orders - Get all pos orders
export async function GET(request: NextRequest) {
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

    // Get the current user's profile to check role/company
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

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

    // For non-superadmins, restrict to their company regardless of filter
    if (userProfile.role !== "SUPERADMIN") {
      if (!userProfile.companyId) {
        return NextResponse.json(
          { error: "User is not associated with a company" },
          { status: 403 }
        );
      }
      whereClause.companyId = userProfile.companyId;
    } else if (companyId) {
      // For superadmins, respect the company filter if provided
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
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userId: true,
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
    const {
      companyId,
      tableSessionId,
      paymentMethod,
      paymentStatus,
      items,
      discount = 0,
    } = body;

    // Validate required fields
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Modified validation to allow empty items arrays when a tableSessionId is provided
    if (
      (!items || !Array.isArray(items) || items.length === 0) &&
      !tableSessionId
    ) {
      return NextResponse.json(
        {
          error:
            "At least one item is required for orders not associated with a table session",
        },
        { status: 400 }
      );
    }

    // Ensure items is at least an empty array
    const orderItems = items || [];

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

    // Validate items and check inventory (only if we have items)
    const itemIds = orderItems.map((item: { itemId: string }) => item.itemId);

    // Special handling for session-payment items
    const hasSessionPaymentItem = itemIds.includes("session-payment");

    // Only query inventory for real items (not session-payment)
    const realItemIds = itemIds.filter(
      (id: string) => id !== "session-payment"
    );

    // If we have real items, validate them against inventory
    const inventoryItems =
      realItemIds.length > 0
        ? await prisma.inventoryItem.findMany({
            where: {
              id: {
                in: realItemIds,
              },
            },
          })
        : [];

    // Create a map for quick lookups
    const inventoryItemMap = new Map(
      inventoryItems.map((item) => [item.id, item])
    );

    // Validate each item
    for (const item of orderItems) {
      // Skip validation for session-payment items
      if (item.itemId === "session-payment") {
        continue;
      }

      const inventoryItem = inventoryItemMap.get(item.itemId);

      if (!inventoryItem) {
        console.error(`Item with ID ${item.itemId} not found in inventory`);
        return NextResponse.json(
          { error: `Item with ID ${item.itemId} not found` },
          { status: 404 }
        );
      }

      if (item.quantity <= 0) {
        console.error(
          `Invalid quantity for item ${inventoryItem.name}: ${item.quantity}`
        );
        return NextResponse.json(
          {
            error: `Quantity must be greater than 0 for item ${inventoryItem.name}`,
          },
          { status: 400 }
        );
      }

      // Special handling for inventory validation when using tracked items
      // If this is part of a table session, check if these items are already tracked in the session
      let effectiveInventoryQuantity = inventoryItem.quantity;

      // Check if this is a tracked item from the client flag
      const typedItem = item as OrderItem;

      if (typedItem.isTrackedItem && tableSessionId) {
        console.log(
          `Found tracked item in order payload: ${inventoryItem.name}, adjusting inventory check`
        );
        // For items marked as tracked, don't check inventory as they've already been deducted
        // when they were added to the tracked items
        continue;
      } else if (tableSessionId) {
        try {
          // Check if this item is already being tracked in this session
          const trackedItems = await prisma.sessionTrackedItem.findMany({
            where: {
              tableSessionId,
              itemId: item.itemId,
            },
          });

          // If we found tracked items, their quantity was already deducted from inventory
          // so we should adjust our check to avoid double-counting
          if (trackedItems.length > 0) {
            const trackedQuantity = trackedItems.reduce(
              (sum, trackedItem) => sum + trackedItem.quantity,
              0
            );
            console.log(
              `Adjusting inventory check for item ${inventoryItem.name}: inventory=${inventoryItem.quantity}, tracked=${trackedQuantity}`
            );

            // Add back the tracked quantity to get the effective inventory for validation
            effectiveInventoryQuantity += trackedQuantity;

            // Important: Mark this item as a tracked item even if it wasn't explicitly marked
            // This ensures proper inventory handling later in the transaction
            typedItem.isTrackedItem = true;

            console.log(
              `Auto-marked item ${inventoryItem.name} as tracked item`
            );
          }
        } catch (err) {
          console.error("Error checking tracked items:", err);
          // Continue with the default check if we can't get tracked items
        }
      }

      // Now check against the effective inventory quantity
      if (effectiveInventoryQuantity < item.quantity) {
        console.error(
          `Not enough stock for item ${inventoryItem.name}. Available: ${effectiveInventoryQuantity}, Requested: ${item.quantity}`
        );
        return NextResponse.json(
          {
            error: `Not enough stock for item ${inventoryItem.name}. Available: ${effectiveInventoryQuantity}, Requested: ${item.quantity}`,
          },
          { status: 400 }
        );
      }

      if (!item.unitPrice || item.unitPrice <= 0) {
        console.error(
          `No valid unit price for item ${inventoryItem.name}: ${item.unitPrice}`
        );
        return NextResponse.json(
          { error: `Unit price is required for item ${inventoryItem.name}` },
          { status: 400 }
        );
      }
    }

    // Calculate total amount
    let totalAmount = orderItems.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    );

    // Add table session cost if present (regardless of whether there are items)
    if (tableSessionId && tableSession?.totalCost) {
      console.log(
        `Adding session cost of ${tableSession.totalCost} to total amount`
      );
      totalAmount += Number(tableSession.totalCost);
    }

    // Apply discount to the total amount
    const discountAmount = Math.max(0, Number(discount) || 0);
    const finalAmount = Math.max(0, totalAmount - discountAmount);

    console.log(
      `Order total calculation: subtotal=${totalAmount}, discount=${discountAmount}, final=${finalAmount}`
    );

    // If this is only a session payment with no real items, we need to look up the session
    // to get the table session cost
    if (hasSessionPaymentItem && realItemIds.length === 0 && tableSessionId) {
      const sessionItem = orderItems.find(
        (item: { itemId: string }) => item.itemId === "session-payment"
      );
      if (sessionItem && tableSession) {
        // Update the total amount with the table session cost
        if (tableSession.totalCost) {
          // The session payment item's unitPrice should already be the session cost
          // But we can verify and use the stored totalCost if needed
          console.log(
            "Session payment: Using session cost:",
            tableSession.totalCost
          );
        }
      }
    }

    // Use a transaction to create the order, order items, and update inventory
    const result = await prisma.$transaction(async (tx) => {
      // Get the staff profile ID from the user ID
      const staffProfile = await tx.profile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      // Create the order
      const order = await tx.posOrder.create({
        data: {
          companyId,
          staffId: staffProfile?.id,
          tableSessionId: tableSessionId || undefined,
          amount: finalAmount,
          discount: discountAmount,
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
      const createdOrderItems = [];
      const stockMovements = [];

      // If this is a table session with no items, mark the session as completed
      if (orderItems.length === 0 && tableSessionId) {
        await tx.tableSession.update({
          where: { id: tableSessionId },
          data: {
            status: "COMPLETED",
          },
        });
        console.log(`Updated session ${tableSessionId} status to COMPLETED`);
      }

      for (const item of orderItems) {
        // Skip creating real inventory items for session-payment
        if (item.itemId === "session-payment") {
          console.log("Processing session payment only:", item);

          // For session payments, we don't create an order item
          // The order amount already includes the session cost

          // If it has a valid tableSessionId, mark the session as completed
          if (tableSessionId) {
            await tx.tableSession.update({
              where: { id: tableSessionId },
              data: {
                status: "COMPLETED",
              },
            });

            console.log(
              `Updated session ${tableSessionId} status to COMPLETED`
            );
          }

          // No need to update inventory or create stock movements
          continue;
        }

        const typedItem = item as OrderItem;

        // Create the order item normally
        const orderItem = await tx.posOrderItem.create({
          data: {
            orderId: order.id,
            itemId: typedItem.itemId,
            quantity: typedItem.quantity,
            unitPrice: typedItem.unitPrice,
          },
        });

        // For tracked items, we need special handling of inventory
        if (typedItem.isTrackedItem && tableSessionId) {
          console.log(
            `Processing tracked item ${typedItem.itemId} with quantity ${typedItem.quantity}`
          );

          // Find the tracked item in the session
          const trackedItem = await tx.sessionTrackedItem.findFirst({
            where: {
              tableSessionId,
              itemId: typedItem.itemId,
            },
          });

          if (trackedItem) {
            console.log(
              `Found tracked item ${trackedItem.id} with quantity ${trackedItem.quantity}`
            );

            // Get the current inventory item to log its current quantity
            const currentInventory = await tx.inventoryItem.findUnique({
              where: { id: typedItem.itemId },
              select: { quantity: true, name: true },
            });
            console.log(
              `Current inventory for ${currentInventory?.name || typedItem.itemId}: ${currentInventory?.quantity}`
            );

            // Check if the order quantity is different from the tracked quantity
            if (typedItem.quantity > trackedItem.quantity) {
              // Only deduct the difference from inventory
              const additionalQuantity =
                typedItem.quantity - trackedItem.quantity;
              console.log(
                `Order quantity (${typedItem.quantity}) is greater than tracked quantity (${trackedItem.quantity}). Deducting additional ${additionalQuantity} from inventory.`
              );

              // Create a stock movement for the tracked portion
              const trackedStaffProfile = await tx.profile.findUnique({
                where: { userId: session.user.id },
                select: { id: true },
              });

              const trackedStockMovement = await tx.stockMovement.create({
                data: {
                  itemId: typedItem.itemId,
                  quantity: -trackedItem.quantity, // Show as negative for sales analytics
                  type: "SALE",
                  reason: `POS Order (from tracked): ${order.id}`,
                  reference: order.id,
                  createdBy: trackedStaffProfile?.id || null,
                },
              });
              stockMovements.push(trackedStockMovement);

              // Create a separate stock movement for the additional quantity and update inventory
              const additionalStockMovement = await tx.stockMovement.create({
                data: {
                  itemId: typedItem.itemId,
                  quantity: -additionalQuantity, // Negative for sales
                  type: "SALE",
                  reason: `POS Order (additional quantity): ${order.id}`,
                  reference: order.id,
                  createdBy: trackedStaffProfile?.id || null,
                },
              });
              stockMovements.push(additionalStockMovement);

              // Update inventory for the additional quantity only
              await tx.inventoryItem.update({
                where: { id: typedItem.itemId },
                data: {
                  quantity: {
                    decrement: additionalQuantity,
                  },
                  lastStockUpdate: new Date(),
                },
              });

              console.log(
                `Updated inventory for additional quantity: -${additionalQuantity}`
              );
            } else {
              // For tracked items with equal or less quantity, create a stock movement to record the purchase
              // But DON'T update inventory as it was already deducted when tracking

              // Get the staff profile for createdBy
              const trackedStaffProfile = await tx.profile.findUnique({
                where: { userId: session.user.id },
                select: { id: true },
              });

              const stockMovement = await tx.stockMovement.create({
                data: {
                  itemId: typedItem.itemId,
                  quantity: -typedItem.quantity, // Show as negative for sales analytics
                  type: "SALE",
                  reason: `POS Order (from tracked): ${order.id}`,
                  reference: order.id,
                  createdBy: trackedStaffProfile?.id || null,
                },
              });
              stockMovements.push(stockMovement);
            }

            // Delete the tracked item as it's now part of a proper order
            await tx.sessionTrackedItem.delete({
              where: { id: trackedItem.id },
            });

            console.log(
              `Deleted tracked item ${trackedItem.id} after converting to order`
            );

            // Important: DON'T update inventory because it was already deducted
            // when the item was tracked. Adding this comment for clarity.
          } else {
            console.log(
              `Warning: Could not find tracked item for ${typedItem.itemId} in session ${tableSessionId}`
            );

            // Fallback to normal inventory update if tracked item not found
            console.log(
              `Falling back to normal inventory update for ${typedItem.itemId}`
            );
            // Get the staff profile for createdBy
            const staffProfile = await tx.profile.findUnique({
              where: { userId: session.user.id },
              select: { id: true },
            });
            const stockMovement = await createStockMovementAndUpdateInventory(
              tx,
              typedItem,
              order.id,
              staffProfile?.id || null
            );
            stockMovements.push(stockMovement);
          }
        } else {
          // Regular (non-tracked) item - create stock movement and update inventory
          console.log(
            `Processing regular item ${typedItem.itemId} with quantity ${typedItem.quantity}`
          );

          // Get current inventory before update
          const itemBefore = await tx.inventoryItem.findUnique({
            where: { id: typedItem.itemId },
            select: { id: true, name: true, quantity: true },
          });
          console.log(
            `Current inventory for ${itemBefore?.name || typedItem.itemId}: ${itemBefore?.quantity || "unknown"}`
          );

          // Create the stock movement and update inventory
          // Get the staff profile for createdBy
          const staffProfile = await tx.profile.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
          });
          const stockMovement = await createStockMovementAndUpdateInventory(
            tx,
            typedItem,
            order.id,
            staffProfile?.id || null
          );
          stockMovements.push(stockMovement);

          // Verify inventory was updated
          const itemAfter = await tx.inventoryItem.findUnique({
            where: { id: typedItem.itemId },
            select: { id: true, name: true, quantity: true },
          });
          console.log(
            `Updated inventory for ${itemAfter?.name || typedItem.itemId}: ${itemAfter?.quantity || "unknown"} (updated from ${itemBefore?.quantity || "unknown"})`
          );
        }

        createdOrderItems.push(orderItem);
      }

      return { order, orderItems: createdOrderItems, stockMovements };
    });

    return NextResponse.json(
      {
        order: result.order,
        orderItems: result.orderItems,
        stockMovements: result.stockMovements,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating POS order:", error);
    return NextResponse.json(
      { error: "Failed to create POS order" },
      { status: 500 }
    );
  }
}

// Helper function for creating stock movement and updating inventory
async function createStockMovementAndUpdateInventory(
  tx: Prisma.TransactionClient,
  item: OrderItem,
  orderId: string,
  staffId: string | null
) {
  console.log(
    `Updating inventory for item ${item.itemId} - removing quantity: ${item.quantity}`
  );

  // Create stock movement (negative quantity for sales)
  const stockMovement = await tx.stockMovement.create({
    data: {
      itemId: item.itemId,
      quantity: -item.quantity, // Negative for sales
      type: "SALE",
      reason: `POS Order: ${orderId}`,
      reference: orderId,
      createdBy: staffId, // Use the staffId (profile.id) instead of userId
    },
  });

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

  return stockMovement;
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
