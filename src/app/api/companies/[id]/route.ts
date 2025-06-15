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

    // Validation for individual day hours JSON
    if (individualDayHours) {
      console.log("Received individualDayHours:", individualDayHours);
      try {
        const parsedHours = JSON.parse(individualDayHours);
        console.log("Parsed individualDayHours:", parsedHours);

        if (typeof parsedHours !== "object" || parsedHours === null) {
          console.error("Invalid object type:", typeof parsedHours);
          return NextResponse.json(
            { error: "Individual day hours debe ser un objeto JSON válido" },
            { status: 400 }
          );
        }

        // Validate each day's structure
        const validDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
        for (const day of validDays) {
          if (parsedHours[day]) {
            const dayData = parsedHours[day];
            console.log(`Validating ${day}:`, dayData);

            if (
              typeof dayData !== "object" ||
              typeof dayData.enabled !== "boolean" ||
              (dayData.enabled && (!dayData.start || !dayData.end))
            ) {
              console.error(`Invalid structure for ${day}:`, dayData);
              return NextResponse.json(
                { error: `Estructura inválida para ${day}` },
                { status: 400 }
              );
            }

            // Validate time format if enabled
            if (dayData.enabled) {
              console.log(
                `Validating times for ${day}: start=${dayData.start}, end=${dayData.end}`
              );
              if (
                !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dayData.start) ||
                !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dayData.end)
              ) {
                console.error(
                  `Invalid time format for ${day}: start=${dayData.start}, end=${dayData.end}`
                );
                return NextResponse.json(
                  { error: `Formato de tiempo inválido para ${day}` },
                  { status: 400 }
                );
              }
            }
          }
        }
        console.log("Individual day hours validation passed");
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return NextResponse.json(
          { error: "Individual day hours debe ser un JSON válido" },
          { status: 400 }
        );
      }
    }

    // Build the update data dynamically
    const updateData: any = {};

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
        code: (prismaError as any)?.code,
        meta: (prismaError as any)?.meta,
        message: (prismaError as any)?.message,
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
