// Re-export the Prisma client as 'db' for API routes
import prisma from './prisma';

export const db = prisma;
export default prisma; 