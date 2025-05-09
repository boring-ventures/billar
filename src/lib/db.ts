/**
 * Universal database client that handles both server and browser environments
 */

// We use separate imports to avoid client-side errors
let prisma;

// Only import the PrismaClient on the server side
if (typeof window === 'undefined') {
  // Server-side code
  const { PrismaClient } = require('@prisma/client');
  
  // PrismaClient is attached to the `global` object to prevent
  // exhausting the database connection limit during development
  const globalForPrisma = global as unknown as { prisma: any };
  
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  
  prisma = globalForPrisma.prisma;
} else {
  // Browser-side code - provide a mock that throws useful errors
  prisma = new Proxy({}, {
    get: () => {
      return () => {
        throw new Error(
          'PrismaClient cannot be used in the browser. ' +
          'Use server components or API routes for database operations.'
        );
      };
    }
  });
}

export { prisma };

// Export as 'db' to match imports in API routes
export const db = prisma; 