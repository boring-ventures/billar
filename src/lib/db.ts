// This file provides a centralized export of the Prisma client
// for database operations throughout the application

// Import the Prisma client instance from the prisma.ts file
import prisma from "./prisma";

// Export the Prisma client as the default export
export default prisma;

// Export as 'db' to match imports in API routes
export const db = prisma; 