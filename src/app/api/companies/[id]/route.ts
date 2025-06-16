import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/companies/[id] - Get a specific company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = (await params).id;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            profiles: true,
            tables: true,
            inventoryItems: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

// PATCH /api/companies/[id] - Update a company
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("=== PATCH API ROUTE CALLED ===");
  console.log("Request method:", request.method);
  console.log("Request URL:", request.url);

  try {
    console.log("Awaiting params...");
    const { id } = await params;
    console.log("Company ID:", id);

    console.log("Parsing request body...");
    const body = await request.json();
    console.log("Request body:", body);

    const {
      name,
      address,
      phone,
      businessHoursStart,
      businessHoursEnd,
      timezone,
      operatingDays,
      individualDayHours,
      useIndividualHours,
    } = body;

    console.log("Extracted fields:", {
      name,
      address,
      phone,
      businessHoursStart,
      businessHoursEnd,
      timezone,
      operatingDays,
      individualDayHours,
      useIndividualHours,
    });

    // Validation for business hours
    if (
      businessHoursStart &&
      !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(businessHoursStart)
    ) {
      return NextResponse.json(
        { error: "Formato de hora de apertura inválido (HH:MM)" },
        { status: 400 }
      );
    }

    if (
      businessHoursEnd &&
      !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(businessHoursEnd)
    ) {
      return NextResponse.json(
        { error: "Formato de hora de cierre inválido (HH:MM)" },
        { status: 400 }
      );
    }

    // Validation for operating days JSON
    if (operatingDays) {
      try {
        const parsedDays = JSON.parse(operatingDays);
        if (!Array.isArray(parsedDays)) {
          return NextResponse.json(
            { error: "Operating days debe ser un array JSON válido" },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Operating days debe ser un JSON válido" },
          { status: 400 }
        );
      }
    }

    // If individual day hours are provided, validate the JSON structure
    if (individualDayHours) {
      let parsedIndividualHours: Record<
        string,
        { enabled: boolean; start?: string; end?: string }
      >;
      try {
        parsedIndividualHours =
          typeof individualDayHours === "string"
            ? JSON.parse(individualDayHours)
            : individualDayHours;
      } catch (parseError) {
        console.error("Individual day hours JSON parse error:", parseError);
        return NextResponse.json(
          { error: "Invalid individual day hours format" },
          { status: 400 }
        );
      }

      const validDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

      for (const [day, config] of Object.entries(parsedIndividualHours)) {
        if (!validDays.includes(day)) {
          return NextResponse.json(
            { error: `Invalid day: ${day}` },
            { status: 400 }
          );
        }

        if (typeof config !== "object" || typeof config.enabled !== "boolean") {
          return NextResponse.json(
            { error: `Invalid configuration for day ${day}` },
            { status: 400 }
          );
        }

        if (config.enabled && config.start && config.end) {
          const timeFormat = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeFormat.test(config.start) || !timeFormat.test(config.end)) {
            return NextResponse.json(
              {
                error: `Invalid time format for day ${day}. Use HH:MM format.`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Build the update data dynamically
    const updateData: {
      name?: string;
      address?: string;
      phone?: string;
      businessHoursStart?: string;
      businessHoursEnd?: string;
      timezone?: string;
      operatingDays?: string;
      individualDayHours?: string;
      useIndividualHours?: boolean;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (businessHoursStart !== undefined)
      updateData.businessHoursStart = businessHoursStart;
    if (businessHoursEnd !== undefined)
      updateData.businessHoursEnd = businessHoursEnd;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (operatingDays !== undefined) updateData.operatingDays = operatingDays;
    if (individualDayHours !== undefined)
      updateData.individualDayHours = individualDayHours;
    if (useIndividualHours !== undefined)
      updateData.useIndividualHours = useIndividualHours;

    console.log("Update data to be sent to Prisma:", updateData);

    let company;
    try {
      console.log("Attempting Prisma update...");
      company = await prisma.company.update({
        where: { id: id },
        data: updateData,
        include: {
          _count: {
            select: {
              profiles: true,
              tables: true,
              inventoryItems: true,
            },
          },
        },
      });
      console.log("Prisma update successful");
    } catch (prismaError) {
      console.error("Prisma update failed:", prismaError);
      console.error("Prisma error details:", {
        code: (prismaError as { code?: string })?.code,
        meta: (prismaError as { meta?: unknown })?.meta,
        message: (prismaError as { message?: string })?.message,
      });
      throw prismaError;
    }

    console.log("Successfully updated company:", company.id);
    return NextResponse.json(company);
  } catch (error) {
    console.error("PATCH Error details:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack available"
    );
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id] - Update a company (alias for PATCH)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}

// DELETE /api/companies/[id] - Delete a company
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = (await params).id;

    // First check if company has associated users
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            profiles: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Don't allow deletion if there are associated users
    if (company._count.profiles > 0) {
      return NextResponse.json(
        { error: "Cannot delete company with associated users" },
        { status: 400 }
      );
    }

    // Delete the company
    await prisma.company.delete({
      where: { id: companyId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
