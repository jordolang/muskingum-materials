/**
 * Singleton PrismaClient instance for database access
 * Prevents multiple client instances during development hot reloading
 */

import { PrismaClient } from "@prisma/client";

/**
 * Global type extension for caching PrismaClient in development
 * Stores the client instance on globalThis to persist across module reloads
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton Prisma database client
 * - In development: reuses cached instance from globalThis to prevent connection exhaustion
 * - In production: creates new instance (safe as module is only imported once)
 * @example
 * ```ts
 * import { prisma } from "@/lib/prisma";
 *
 * // Query the database
 * const users = await prisma.user.findMany();
 * const product = await prisma.product.findUnique({ where: { id: "123" } });
 * ```
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Cache client in development to survive hot reloading
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
