import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating customer
const updateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(1, "Phone number is required").optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// GET a specific customer
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
    
    // Get customer using Prisma with reservation count
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { reservations: true }
        },
        reservations: {
          orderBy: { startDate: 'desc' },
          take: 5, // Get only the 5 most recent reservations
          include: {
            table: true,
          }
        }
      }
    });
    
    if (!customer) {
      return NextResponse.json(
        { data: null },
        { status: 404 }
      );
    }
    
    // Map the result to include reservation count and limit returned data
    const customerData = {
      ...customer,
      reservationCount: customer._count.reservations,
      _count: undefined, // Remove the _count field from the result
    };
    
    // Return response
    return NextResponse.json({ data: customerData });
  } catch (error: any) {
    console.error("Error fetching customer:", error);
    // Return null data instead of error object as per section 7
    return NextResponse.json(
      { data: null },
      { status: error.status || 500 }
    );
  }
}

// UPDATE a customer
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request - enforcing SUPERADMIN role
    const profile = await authenticateRequest(req);
    
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id },
    });
    
    if (!existingCustomer) {
      return NextResponse.json(
        { data: null, error: "Customer not found" },
        { status: 404 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    
    try {
      // Validate with zod schema
      const validatedData = updateCustomerSchema.parse(body);
      
      // If email is being updated, check if it's already in use by another customer
      if (validatedData.email && validatedData.email !== existingCustomer.email) {
        const emailInUse = await prisma.customer.findFirst({
          where: {
            email: validatedData.email,
            id: { not: params.id }
          }
        });
        
        if (emailInUse) {
          return NextResponse.json(
            { error: "This email is already in use by another customer" },
            { status: 400 }
          );
        }
      }
      
      // Update customer using Prisma transaction
      const updatedCustomer = await prisma.$transaction(async (tx) => {
        return tx.customer.update({
          where: { id: params.id },
          data: {
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone,
            address: validatedData.address,
            notes: validatedData.notes,
          },
          include: {
            _count: {
              select: { reservations: true }
            }
          }
        });
      });
      
      // Map the result to include reservation count
      const customerData = {
        ...updatedCustomer,
        reservationCount: updatedCustomer._count.reservations,
        _count: undefined, // Remove the _count field from the result
      };
      
      return NextResponse.json({ data: customerData });
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        return NextResponse.json({ error: zodError.errors }, { status: 400 });
      }
      throw zodError; // Re-throw if it's another type of error
    }
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", data: null },
      { status: error.status || 500 }
    );
  }
}

// DELETE a customer
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request - enforcing SUPERADMIN role
    const profile = await authenticateRequest(req);
    
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { reservations: true }
        }
      }
    });
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    
    // Check if customer has any reservations
    if (existingCustomer._count.reservations > 0) {
      return NextResponse.json(
        { error: "Cannot delete customer with existing reservations" },
        { status: 400 }
      );
    }
    
    // Delete the customer using Prisma transaction
    await prisma.$transaction(async (tx) => {
      await tx.customer.delete({
        where: { id: params.id },
      });
    });
    
    return NextResponse.json(
      { success: true, message: "Customer deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", success: false },
      { status: error.status || 500 }
    );
  }
} 