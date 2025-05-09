import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    console.log("=== Running Database Seed ===");
    
    // Check if data already exists
    const existingCategories = await prisma.inventoryCategory.count();
    const existingItems = await prisma.inventoryItem.count();
    
    console.log(`Existing data: ${existingCategories} categories, ${existingItems} items`);
    
    if (existingCategories > 0 || existingItems > 0) {
      console.log("Data already exists, skipping seed");
      return NextResponse.json({ 
        message: "Data already exists, skipping seed",
        existingCategories,
        existingItems
      });
    }
    
    // Create test company if none exists
    const company = await prisma.company.findFirst() || 
      await prisma.company.create({
        data: {
          name: "Test Company"
        }
      });
    
    console.log("Using company:", company.id, company.name);
    
    // Create test categories
    const categories = await Promise.all([
      prisma.inventoryCategory.create({
        data: {
          name: "Drinks",
          description: "Beverages and refreshments",
          companyId: company.id
        }
      }),
      prisma.inventoryCategory.create({
        data: {
          name: "Equipment",
          description: "Pool tables and accessories",
          companyId: company.id
        }
      }),
      prisma.inventoryCategory.create({
        data: {
          name: "Merchandise",
          description: "Branded items for sale",
          companyId: company.id
        }
      })
    ]);
    
    console.log(`Created ${categories.length} categories`);
    
    // Create test items
    const items = await Promise.all([
      prisma.inventoryItem.create({
        data: {
          name: "Pool Cue",
          sku: "PC001",
          quantity: 20,
          criticalThreshold: 5,
          price: 25.99,
          companyId: company.id,
          categoryId: categories[1].id,
          stockAlerts: true,
          lastStockUpdate: new Date()
        }
      }),
      prisma.inventoryItem.create({
        data: {
          name: "Chalk",
          sku: "CH001",
          quantity: 50,
          criticalThreshold: 10,
          price: 2.99,
          companyId: company.id,
          categoryId: categories[1].id,
          stockAlerts: true,
          lastStockUpdate: new Date()
        }
      }),
      prisma.inventoryItem.create({
        data: {
          name: "Cola",
          sku: "DR001",
          quantity: 100,
          criticalThreshold: 20,
          price: 1.99,
          companyId: company.id,
          categoryId: categories[0].id,
          stockAlerts: true,
          lastStockUpdate: new Date()
        }
      }),
      prisma.inventoryItem.create({
        data: {
          name: "T-Shirt",
          sku: "TS001",
          quantity: 30,
          criticalThreshold: 5,
          price: 15.99,
          companyId: company.id,
          categoryId: categories[2].id,
          stockAlerts: true,
          lastStockUpdate: new Date()
        }
      })
    ]);
    
    console.log(`Created ${items.length} items`);
    
    return NextResponse.json({ 
      message: "Seed completed successfully",
      categories: categories.length,
      items: items.length
    });
  } catch (error: any) {
    console.error("Error in seed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to seed database" },
      { status: 500 }
    );
  }
} 