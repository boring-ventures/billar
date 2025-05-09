/**
 * This is a placeholder file that provides empty implementations
 * for browser environments where Prisma client is not supported.
 * 
 * It will be used by Next.js when code runs in the browser.
 */

// Define an empty client interface that matches the structure we need
export interface EmptyPrismaClient {
  [key: string]: any;
}

// Create an empty client to avoid errors in browser
const browserClient: EmptyPrismaClient = new Proxy({}, {
  get: (target, prop) => {
    if (typeof prop === 'string') {
      // Return a function that throws an error if called
      return () => {
        throw new Error(
          `PrismaClient cannot be used in the browser. ` +
          `Use server components or API routes for database operations.`
        );
      };
    }
    return undefined;
  }
});

export default browserClient; 