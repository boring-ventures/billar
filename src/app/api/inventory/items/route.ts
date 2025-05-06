import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id as string },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const searchQuery = req.nextUrl.searchParams.get("query");
    const lowStock = req.nextUrl.searchParams.get("lowStock") === "true";

    const items = await prisma.inventoryItem.findMany({
      where: {
        companyId: profile.companyId as string,
        ...(searchQuery
          ? {
              OR: [
                { name: { contains: searchQuery, mode: "insensitive" } },
                { sku: { contains: searchQuery, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(lowStock
          ? {
              quantity: {
                lte: prisma.inventoryItem.fields.criticalThreshold,
              },
            }
          : {}),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id as string },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!profile.companyId) {
      return NextResponse.json(
        { error: "Company not associated with profile" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Validate if category exists if provided
    if (body.categoryId) {
      const category = await prisma.inventoryCategory.findUnique({
        where: { id: body.categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 400 }
        );
      }

      if (category.companyId !== profile.companyId) {
        return NextResponse.json(
          { error: "Category does not belong to your company" },
          { status: 403 }
        );
      }
    }

    // Create item
    const item = await prisma.inventoryItem.create({
      data: {
        name: body.name,
        companyId: profile.companyId,
        categoryId: body.categoryId || null,
        sku: body.sku || null,
        quantity: body.quantity || 0,
        criticalThreshold: body.criticalThreshold || 5,
        price: body.price || null,
        stockAlerts: body.stockAlerts !== undefined ? body.stockAlerts : true,
        lastStockUpdate: new Date(),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
