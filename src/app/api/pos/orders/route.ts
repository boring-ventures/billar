import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { PaymentStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");
    const limit = searchParams.has("limit")
      ? parseInt(searchParams.get("limit")!)
      : 10;
    const offset = searchParams.has("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;
    const status = searchParams.get("status");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if user is authorized to access this company's data
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // For non-superadmins, restrict to their company regardless of filter
    if (userProfile.role !== "SUPERADMIN") {
      if (!userProfile.companyId) {
        return NextResponse.json(
          { error: "User is not associated with a company" },
          { status: 403 }
        );
      }
      // Override companyId with user's company for non-superadmins
      if (userProfile.companyId !== companyId) {
        return NextResponse.json(
          { error: "Unauthorized access to company data" },
          { status: 403 }
        );
      }
    }

    // Build the query
    const where = {
      companyId,
      ...(status && { paymentStatus: status as PaymentStatus }),
    };

    // Get orders
    const orders = await prisma.posOrder.findMany({
      where,
      include: {
        orderItems: {
          include: {
            item: true,
          },
        },
        tableSession: {
          include: {
            table: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
