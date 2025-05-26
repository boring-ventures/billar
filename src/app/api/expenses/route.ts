import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Prisma, ExpenseCategory } from "@prisma/client";

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { company: true },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Determine which company to query
    let targetCompanyId: string;

    if (userProfile.role === "SUPERADMIN") {
      // SUPERADMIN can view expenses for any company, but companyId must be provided
      if (!companyId) {
        return NextResponse.json(
          { error: "Company ID is required for SUPERADMIN users" },
          { status: 400 }
        );
      }
      targetCompanyId = companyId;
    } else {
      // Regular users can only view expenses for their own company
      if (!userProfile.companyId) {
        return NextResponse.json(
          { error: "User profile has no company assigned" },
          { status: 404 }
        );
      }

      // If companyId is provided, verify it matches user's company
      if (companyId && companyId !== userProfile.companyId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      targetCompanyId = userProfile.companyId;
    }

    // Build where clause
    const where: Prisma.ExpenseWhereInput = {
      companyId: targetCompanyId,
    };

    if (category) {
      where.category = category as ExpenseCategory;
    }

    if (startDate && endDate) {
      where.expenseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Fetch expenses
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        expenseDate: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error("Authentication error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { company: true },
    });

    if (!userProfile) {
      console.error("User profile not found");
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log("Request body:", body);
    const { companyId, category, description, amount, expenseDate, notes } =
      body;

    // Determine which company to use
    let targetCompanyId: string;

    if (userProfile.role === "SUPERADMIN") {
      // SUPERADMIN can create expenses for any company, but companyId must be provided
      if (!companyId) {
        console.error("SUPERADMIN must provide companyId in request");
        return NextResponse.json(
          { error: "Company ID is required for SUPERADMIN users" },
          { status: 400 }
        );
      }
      targetCompanyId = companyId;
    } else {
      // Regular users can only create expenses for their own company
      if (!userProfile.companyId) {
        console.error("User profile has no company assigned");
        return NextResponse.json(
          { error: "User profile has no company assigned" },
          { status: 404 }
        );
      }

      // If companyId is provided, verify it matches user's company
      if (companyId && companyId !== userProfile.companyId) {
        console.error(
          "Access denied: Cannot create expenses for other companies"
        );
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      targetCompanyId = userProfile.companyId;
    }

    // Validate required fields
    if (!category || !description || !amount || !expenseDate) {
      console.error("Missing required fields:", {
        category,
        description,
        amount,
        expenseDate,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (Number(amount) <= 0) {
      console.error("Invalid amount:", amount);
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    console.log("Creating expense with data:", {
      companyId: targetCompanyId,
      category,
      description,
      amount: Number(amount),
      expenseDate: new Date(expenseDate),
      notes,
      createdById: userProfile.id,
    });

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        companyId: targetCompanyId,
        category,
        description,
        amount: Number(amount),
        expenseDate: new Date(expenseDate),
        notes,
        createdById: userProfile.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log("Expense created successfully:", expense.id);
    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error creating expense:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
