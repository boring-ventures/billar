import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for customer
const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
  notes: z.string().optional(),
  companyId: z.string().optional(), // Optional for superadmin operations
});

// GET all customers
export async function GET(req: NextRequest) {
  try {
    // Authenticate request - enforcing SUPERADMIN role as per section 6
    const profile = await authenticateRequest(req);
    
    console.log("Profile from auth middleware:", {
      id: profile.id,
      role: profile.role,
      companyId: profile.companyId,
      isSuperAdmin: profile.role === "SUPERADMIN"
    });
    
    // For SUPERADMIN, no company filter is applied
    let queryFilter: any = {};
    console.log("Using SUPERADMIN access pattern - no company filter applied");
    
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    // Add search filter if query parameter exists
    if (query) {
      queryFilter = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } }
        ]
      };
    }
    
    // Get customers from database using Prisma
    const customers = await prisma.customer.findMany({
      where: queryFilter,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { reservations: true }
        }
      }
    });
    
    // Map the results to include reservation count
    const customersWithCount = customers.map(customer => ({
      ...customer,
      reservationCount: customer._count.reservations,
      _count: undefined // Remove the _count field from the result
    }));
    
    // Return response with empty array as fallback
    return NextResponse.json({ 
      data: Array.isArray(customersWithCount) ? customersWithCount : [] 
    });
  } catch (error: any) {
    console.error("Error in customers API:", error);
    // Return empty array instead of error object as per section 7
    return NextResponse.json(
      { data: [] },
      { status: error.status || 500 }
    );
  }
}

// POST to create new customer
export async function POST(req: NextRequest) {
  try {
    // Authenticate request - enforcing SUPERADMIN role
    const profile = await authenticateRequest(req);
    
    // Parse and validate request body
    const body = await req.json();
    
    try {
      // Validate with zod schema
      const validatedData = customerSchema.parse(body);
      
      // Determine company context for superadmin operations
      let operationCompanyId: string;
      
      // Handle company context resolution for SUPERADMIN
      if (validatedData.companyId) {
        // Use provided company ID after validation
        const companyExists = await prisma.company.findUnique({
          where: { id: validatedData.companyId },
        });
        
        if (!companyExists) {
          return NextResponse.json({ error: "Company not found" }, { status: 400 });
        }
        
        operationCompanyId = validatedData.companyId;
      } else {
        // Auto-resolve to first available company or create default
        const defaultCompany = await prisma.company.findFirst({
          orderBy: { name: 'asc' }
        }) || await prisma.company.create({
          data: { name: "Default Company" }
        });
        
        operationCompanyId = defaultCompany.id;
      }
      
      // Check if customer with the same email already exists
      const existingCustomer = await prisma.customer.findFirst({
        where: { email: validatedData.email }
      });
      
      if (existingCustomer) {
        return NextResponse.json({ error: "A customer with this email already exists" }, { status: 400 });
      }
      
      // Create new customer using Prisma transaction
      const newCustomer = await prisma.$transaction(async (tx) => {
        // Create the customer
        return tx.customer.create({
          data: {
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone,
            address: validatedData.address,
            notes: validatedData.notes,
            company: {
              connect: { id: operationCompanyId }
            }
          }
        });
      });
      
      return NextResponse.json({ data: newCustomer }, { status: 201 });
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        return NextResponse.json({ error: zodError.errors }, { status: 400 });
      }
      throw zodError; // Re-throw if it's another type of error
    }
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", data: null },
      { status: error.status || 500 }
    );
  }
} 