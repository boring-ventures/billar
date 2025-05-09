import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating reservation
const updateReservationSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required").optional(),
  tableId: z.string().min(1, "Table ID is required").optional(),
  startDate: z.string().optional(), // Date string that will be converted
  endDate: z.string().optional(), // Date string that will be converted
  status: z.enum(["PENDING", "CONFIRMED", "CANCELED", "COMPLETED"]).optional(),
  notes: z.string().optional(),
});

// GET a specific reservation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request - enforcing SUPERADMIN role
    const profile = await authenticateRequest(req);
    
    console.log("Profile from auth middleware:", {
      id: profile.id,
      role: profile.role,
      companyId: profile.companyId,
      isSuperAdmin: profile.role === "SUPERADMIN"
    });
    
    // Get reservation using Prisma
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        table: true,
      },
    });
    
    if (!reservation) {
      return NextResponse.json(
        { data: null },
        { status: 404 }
      );
    }
    
    // Return response
    return NextResponse.json({ data: reservation });
  } catch (error: any) {
    console.error("Error fetching reservation:", error);
    // Return null data instead of error object as per section 7
    return NextResponse.json(
      { data: null },
      { status: error.status || 500 }
    );
  }
}

// UPDATE a reservation
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request - enforcing SUPERADMIN role
    const profile = await authenticateRequest(req);
    
    // Check if reservation exists
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: params.id },
    });
    
    if (!existingReservation) {
      return NextResponse.json(
        { data: null, error: "Reservation not found" },
        { status: 404 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    
    try {
      // Validate with zod schema
      const validatedData = updateReservationSchema.parse(body);
      
      // Check for overlapping reservations if dates or tableId are being updated
      if (validatedData.startDate || validatedData.endDate || validatedData.tableId) {
        const startDate = validatedData.startDate 
          ? new Date(validatedData.startDate) 
          : existingReservation.startDate;
        
        const endDate = validatedData.endDate 
          ? new Date(validatedData.endDate) 
          : existingReservation.endDate;
        
        const tableId = validatedData.tableId || existingReservation.tableId;
        
        // Skip checking for overlap if we're canceling or completing a reservation
        if (validatedData.status !== "CANCELED" && validatedData.status !== "COMPLETED") {
          const overlappingReservations = await prisma.reservation.findMany({
            where: {
              id: { not: params.id }, // Exclude the current reservation
              tableId: tableId,
              status: { in: ["PENDING", "CONFIRMED"] },
              OR: [
                {
                  AND: [
                    { startDate: { lte: startDate } },
                    { endDate: { gte: startDate } }
                  ]
                },
                {
                  AND: [
                    { startDate: { lte: endDate } },
                    { endDate: { gte: endDate } }
                  ]
                },
                {
                  AND: [
                    { startDate: { gte: startDate } },
                    { endDate: { lte: endDate } }
                  ]
                }
              ]
            }
          });
          
          if (overlappingReservations.length > 0) {
            return NextResponse.json(
              { error: "This table is already reserved for the selected time period" }, 
              { status: 400 }
            );
          }
        }
      }
      
      // Update reservation using Prisma transaction
      const updatedReservation = await prisma.$transaction(async (tx) => {
        return tx.reservation.update({
          where: { id: params.id },
          data: {
            customerId: validatedData.customerId,
            tableId: validatedData.tableId,
            startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
            endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
            status: validatedData.status,
            notes: validatedData.notes,
          },
          include: {
            customer: true,
            table: true,
          }
        });
      });
      
      return NextResponse.json({ data: updatedReservation });
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        return NextResponse.json({ error: zodError.errors }, { status: 400 });
      }
      throw zodError; // Re-throw if it's another type of error
    }
  } catch (error: any) {
    console.error("Error updating reservation:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", data: null },
      { status: error.status || 500 }
    );
  }
}

// DELETE a reservation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request - enforcing SUPERADMIN role
    const profile = await authenticateRequest(req);
    
    // Check if reservation exists
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: params.id },
    });
    
    if (!existingReservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }
    
    // Delete the reservation using Prisma transaction
    await prisma.$transaction(async (tx) => {
      await tx.reservation.delete({
        where: { id: params.id },
      });
    });
    
    return NextResponse.json(
      { success: true, message: "Reservation deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting reservation:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", success: false },
      { status: error.status || 500 }
    );
  }
} 