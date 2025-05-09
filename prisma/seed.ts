import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create a test company if it doesn't exist
  let company = await prisma.company.findFirst({
    where: { name: 'Test Company' },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Test Company',
        address: '123 Test Street',
        phone: '555-1234',
      },
    });
  }

  console.log('Using company:', company);

  // Create a SUPERADMIN profile
  // Note: This assumes a user with this ID exists in your auth provider (like Supabase)
  // You would need to create this user manually in Supabase first
  const superadminUserId = '00000000-0000-0000-0000-000000000000'; // Replace with a real user ID
  
  // Create the superadmin profile
  const superadmin = await prisma.profile.upsert({
    where: { userId: superadminUserId },
    update: {
      role: UserRole.SUPERADMIN,
    },
    create: {
      userId: superadminUserId,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPERADMIN,
      // Note: No companyId for superadmin
    },
  });

  console.log('Created superadmin profile:', superadmin);

  // Create a regular seller profile with company
  const sellerUserId = '11111111-1111-1111-1111-111111111111'; // Replace with a real user ID
  
  const seller = await prisma.profile.upsert({
    where: { userId: sellerUserId },
    update: {
      role: UserRole.SELLER,
      companyId: company.id,
    },
    create: {
      userId: sellerUserId,
      firstName: 'Regular',
      lastName: 'Seller',
      role: UserRole.SELLER,
      companyId: company.id,
    },
  });

  console.log('Created seller profile:', seller);

  // Create some inventory categories
  let category1 = await prisma.inventoryCategory.findFirst({
    where: { 
      name: 'Electronics',
      companyId: company.id 
    },
  });

  if (!category1) {
    category1 = await prisma.inventoryCategory.create({
      data: {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        companyId: company.id,
      },
    });
  }

  let category2 = await prisma.inventoryCategory.findFirst({
    where: { 
      name: 'Office Supplies',
      companyId: company.id 
    },
  });

  if (!category2) {
    category2 = await prisma.inventoryCategory.create({
      data: {
        name: 'Office Supplies',
        description: 'Office supplies and equipment',
        companyId: company.id,
      },
    });
  }

  console.log('Using inventory categories:', category1, category2);

  // Create some inventory items
  let item1 = await prisma.inventoryItem.findFirst({
    where: { 
      sku: 'ITEM001',
    },
  });

  if (!item1) {
    item1 = await prisma.inventoryItem.create({
      data: {
        name: 'Laptop',
        sku: 'ITEM001',
        quantity: 10,
        criticalThreshold: 2,
        price: 999.99,
        categoryId: category1.id,
        companyId: company.id,
        lastStockUpdate: new Date(),
      },
    });
  }

  let item2 = await prisma.inventoryItem.findFirst({
    where: { 
      sku: 'ITEM002',
    },
  });

  if (!item2) {
    item2 = await prisma.inventoryItem.create({
      data: {
        name: 'Notebook',
        sku: 'ITEM002',
        quantity: 50,
        criticalThreshold: 10,
        price: 4.99,
        categoryId: category2.id,
        companyId: company.id,
        lastStockUpdate: new Date(),
      },
    });
  }

  console.log('Using inventory items:', item1, item2);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 