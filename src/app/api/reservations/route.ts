import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schema for reservation
const reservationSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  tableId: z.string().min(1, "Table ID is required"),
  startDate: z.string(), // Date string that will be converted to Date
  endDate: z.string(), // Date string that will be converted to Date
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
  notes: z.string().optional(),
  companyId: z.string().optional(), // Optional for superadmin operations
});

// GET all reservations data
export async function GET(req: NextRequest) {
  try {
    // Authenticate request - enforcing SUPERADMIN role as per section 6
    const profile = await authenticateRequest(req);

    console.log("Profile from auth middleware:", {
      id: profile.id,
      role: profile.role,
      companyId: profile.companyId,
      isSuperAdmin: profile.role === "SUPERADMIN",
    });

    // For SUPERADMIN, no company filter is applied
    let queryFilter: any = {};
    console.log("Using SUPERADMIN access pattern - no company filter applied");

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query");

    // Add search filter if query parameter exists
    if (query) {
      queryFilter = {
        OR: [
          {
            customer: {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
          {
            table: {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        ],
      };
    }

    // Get reservations data from database using Prisma
    const reservations = await prisma.tableReservation.findMany({
      where: queryFilter,
      orderBy: { reservedFrom: "desc" },
      include: {
        customer: true,
        table: true,
      },
    });

    // Return response with empty array as fallback
    return NextResponse.json({
      data: Array.isArray(reservations) ? reservations : [],
    });
  } catch (error: any) {
    console.error("Error in reservations API:", error);
    // Return empty array instead of error object as per section 7
    return NextResponse.json({ data: [] }, { status: error.status || 500 });
  }
}

// POST to create new reservation
export async function POST(req: NextRequest) {
  try {
    // Authenticate request - enforcing SUPERADMIN role
    const profile = await authenticateRequest(req);

    // Parse and validate request body
    const body = await req.json();

    try {
      // Validate with zod schema
      const validatedData = reservationSchema.parse(body);

      // Determine company context for superadmin operations
      let operationCompanyId: string;

      // Handle company context resolution for SUPERADMIN
      if (validatedData.companyId) {
        // Use provided company ID after validation
        const companyExists = await prisma.company.findUnique({
          where: { id: validatedData.companyId },
        });

        if (!companyExists) {
          return NextResponse.json(
            { error: "Company not found" },
            { status: 400 }
          );
        }

        operationCompanyId = validatedData.companyId;
      } else {
        // Auto-resolve to first available company or create default
        const defaultCompany =
          (await prisma.company.findFirst({
            orderBy: { name: "asc" },
          })) ||
          (await prisma.company.create({
            data: { name: "Default Company" },
          }));

        operationCompanyId = defaultCompany.id;
      }

      // Get table to ensure it exists and belongs to the company
      const table = await prisma.table.findFirst({
        where: {
          id: validatedData.tableId,
          companyId: operationCompanyId,
        },
      });

      if (!table) {
        return NextResponse.json(
          { error: "Table not found or doesn't belong to the company" },
          { status: 400 }
        );
      }

      // Check customer exists
      const customer = await prisma.customer.findUnique({
        where: { id: validatedData.customerId },
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 400 }
        );
      }

      // Check for overlapping reservations for the same table
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(validatedData.endDate);

      const overlappingReservations = await prisma.tableReservation.findMany({
        where: {
          tableId: validatedData.tableId,
          status: { in: ["PENDING", "CONFIRMED"] },
          OR: [
            {
              AND: [
                { reservedFrom: { lte: startDate } },
                { reservedTo: { gte: startDate } },
              ],
            },
            {
              AND: [
                { reservedFrom: { lte: endDate } },
                { reservedTo: { gte: endDate } },
              ],
            },
            {
              AND: [
                { reservedFrom: { gte: startDate } },
                { reservedTo: { lte: endDate } },
              ],
            },
          ],
        },
      });

      if (overlappingReservations.length > 0) {
        return NextResponse.json(
          {
            error:
              "This table is already reserved for the selected time period",
          },
          { status: 400 }
        );
      }

      // Create new reservation record using Prisma transaction
      const newReservation = await prisma.$transaction(async (tx) => {
        // Create the record
        return tx.tableReservation.create({
          data: {
            customerId: validatedData.customerId,
            tableId: validatedData.tableId,
            reservedFrom: startDate,
            reservedTo: endDate,
            status: validatedData.status,
          },
          include: {
            customer: true,
            table: true,
          },
        });
      });

      return NextResponse.json({ data: newReservation }, { status: 201 });
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        return NextResponse.json({ error: zodError.errors }, { status: 400 });
      }
      throw zodError; // Re-throw if it's another type of error
    }
  } catch (error: any) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", data: null },
      { status: error.status || 500 }
    );
  }
}
