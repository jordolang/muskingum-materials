/**
 * Reconciliation Logic for Prisma ↔ Sanity Content Sync
 *
 * Detects missing and orphaned records by comparing slugs between
 * Prisma (PostgreSQL) and Sanity CMS stores.
 *
 * Architecture:
 * 1. Query both Prisma and Sanity for all records
 * 2. Compare by slug (the canonical identifier)
 * 3. Report mismatches for manual review
 * 4. Never auto-delete - reconciliation is read-only
 *
 * @see docs/sync-field-ownership.md for field ownership rules
 */

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { sanityClient } from "@/lib/sanity/client";

/**
 * Result of a reconciliation operation
 */
export interface ReconciliationResult {
  /** Records that exist only in Prisma (not yet synced to Sanity) */
  onlyInPrisma: Array<{ id: string; slug: string; name: string }>;
  /** Records that exist only in Sanity (orphaned in Sanity) */
  onlyInSanity: Array<{ id: string; slug: string }>;
  /** Records that exist in both stores (successfully synced) */
  inBoth: Array<{ prismaId: string; sanityId: string; slug: string }>;
}

/**
 * Checks if database is available
 * Returns false during preview builds without DATABASE_URL
 */
function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Checks if Sanity API token is configured
 */
function hasSanityCredentials(): boolean {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  return Boolean(projectId && projectId !== "placeholder");
}

/**
 * Reconciles products between Prisma and Sanity
 *
 * Compares product records by slug and identifies:
 * - Products in Prisma but not in Sanity (need sync)
 * - Products in Sanity but not in Prisma (orphaned)
 * - Products in both stores (synced)
 *
 * @returns Reconciliation result with categorized records
 *
 * @example
 * ```ts
 * import { reconcileProducts } from "@/lib/sync/reconcile";
 *
 * const result = await reconcileProducts();
 *
 * if (result.onlyInPrisma.length > 0) {
 *   console.log(`${result.onlyInPrisma.length} products need syncing`);
 * }
 *
 * if (result.onlyInSanity.length > 0) {
 *   console.log(`${result.onlyInSanity.length} orphaned products in Sanity`);
 * }
 * ```
 */
export async function reconcileProducts(): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    onlyInPrisma: [],
    onlyInSanity: [],
    inBoth: [],
  };

  try {
    // Skip reconciliation if either store is unavailable
    if (!hasDatabase()) {
      logger.warn("Product reconciliation skipped - no database configured");
      return result;
    }

    if (!hasSanityCredentials()) {
      logger.warn("Product reconciliation skipped - Sanity not configured");
      return result;
    }

    logger.info("Starting product reconciliation");

    // Fetch all products from Prisma
    const prismaProducts = await prisma.product.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { slug: "asc" },
    });

    // Fetch all products from Sanity (only _id and slug)
    const sanityProducts = await sanityClient.fetch<
      Array<{ _id: string; slug: { current: string } }>
    >(
      `*[_type == "product"] {
        _id,
        slug
      }`,
    );

    // Create lookup maps by slug for efficient comparison
    const prismaBySlug = new Map<string, { id: string; name: string }>(
      prismaProducts.map((p) => [p.slug, { id: p.id, name: p.name }]),
    );
    const sanityBySlug = new Map<string, string>(
      (sanityProducts || [])
        .filter((s) => s.slug?.current)
        .map((s) => [s.slug.current, s._id]),
    );

    // Find products only in Prisma
    for (const [slug, data] of prismaBySlug.entries()) {
      if (!sanityBySlug.has(slug)) {
        result.onlyInPrisma.push({
          id: data.id,
          slug,
          name: data.name,
        });
      }
    }

    // Find products only in Sanity
    for (const [slug, sanityId] of sanityBySlug.entries()) {
      if (!prismaBySlug.has(slug)) {
        result.onlyInSanity.push({
          id: sanityId,
          slug,
        });
      }
    }

    // Find products in both stores
    for (const [slug, data] of prismaBySlug.entries()) {
      const sanityId = sanityBySlug.get(slug);
      if (sanityId) {
        result.inBoth.push({
          prismaId: data.id,
          sanityId,
          slug,
        });
      }
    }

    // Log warnings for mismatches (but don't treat as errors)
    if (result.onlyInPrisma.length > 0) {
      logger.warn("Products found in Prisma but not in Sanity", {
        count: result.onlyInPrisma.length,
        slugs: result.onlyInPrisma.map((p) => p.slug),
      });
    }

    if (result.onlyInSanity.length > 0) {
      logger.warn("Products found in Sanity but not in Prisma (orphaned)", {
        count: result.onlyInSanity.length,
        slugs: result.onlyInSanity.map((p) => p.slug),
      });
    }

    logger.info("Product reconciliation completed", {
      totalPrisma: prismaProducts.length,
      totalSanity: sanityProducts?.length || 0,
      inBoth: result.inBoth.length,
      onlyInPrisma: result.onlyInPrisma.length,
      onlyInSanity: result.onlyInSanity.length,
    });

    return result;
  } catch (error) {
    logger.error("Product reconciliation failed", error);

    // Return partial results even on error
    return result;
  }
}

/**
 * Reconciles services between Prisma and Sanity
 *
 * Compares service records by slug and identifies:
 * - Services in Prisma but not in Sanity (need sync)
 * - Services in Sanity but not in Prisma (orphaned)
 * - Services in both stores (synced)
 *
 * @returns Reconciliation result with categorized records
 *
 * @example
 * ```ts
 * import { reconcileServices } from "@/lib/sync/reconcile";
 *
 * const result = await reconcileServices();
 *
 * if (result.onlyInPrisma.length > 0) {
 *   console.log(`${result.onlyInPrisma.length} services need syncing`);
 * }
 *
 * if (result.onlyInSanity.length > 0) {
 *   console.log(`${result.onlyInSanity.length} orphaned services in Sanity`);
 * }
 * ```
 */
export async function reconcileServices(): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    onlyInPrisma: [],
    onlyInSanity: [],
    inBoth: [],
  };

  try {
    // Skip reconciliation if either store is unavailable
    if (!hasDatabase()) {
      logger.warn("Service reconciliation skipped - no database configured");
      return result;
    }

    if (!hasSanityCredentials()) {
      logger.warn("Service reconciliation skipped - Sanity not configured");
      return result;
    }

    logger.info("Starting service reconciliation");

    // Fetch all services from Prisma
    const prismaServices = await prisma.service.findMany({
      select: { id: true, slug: true, title: true },
      orderBy: { slug: "asc" },
    });

    // Fetch all services from Sanity (only _id and slug)
    const sanityServices = await sanityClient.fetch<
      Array<{ _id: string; slug: { current: string } }>
    >(
      `*[_type == "service"] {
        _id,
        slug
      }`,
    );

    // Create lookup maps by slug for efficient comparison
    const prismaBySlug = new Map<string, { id: string; name: string }>(
      prismaServices.map((s) => [s.slug, { id: s.id, name: s.title }]),
    );
    const sanityBySlug = new Map<string, string>(
      (sanityServices || [])
        .filter((s) => s.slug?.current)
        .map((s) => [s.slug.current, s._id]),
    );

    // Find services only in Prisma
    for (const [slug, data] of prismaBySlug.entries()) {
      if (!sanityBySlug.has(slug)) {
        result.onlyInPrisma.push({
          id: data.id,
          slug,
          name: data.name,
        });
      }
    }

    // Find services only in Sanity
    for (const [slug, sanityId] of sanityBySlug.entries()) {
      if (!prismaBySlug.has(slug)) {
        result.onlyInSanity.push({
          id: sanityId,
          slug,
        });
      }
    }

    // Find services in both stores
    for (const [slug, data] of prismaBySlug.entries()) {
      const sanityId = sanityBySlug.get(slug);
      if (sanityId) {
        result.inBoth.push({
          prismaId: data.id,
          sanityId,
          slug,
        });
      }
    }

    // Log warnings for mismatches (but don't treat as errors)
    if (result.onlyInPrisma.length > 0) {
      logger.warn("Services found in Prisma but not in Sanity", {
        count: result.onlyInPrisma.length,
        slugs: result.onlyInPrisma.map((s) => s.slug),
      });
    }

    if (result.onlyInSanity.length > 0) {
      logger.warn("Services found in Sanity but not in Prisma (orphaned)", {
        count: result.onlyInSanity.length,
        slugs: result.onlyInSanity.map((s) => s.slug),
      });
    }

    logger.info("Service reconciliation completed", {
      totalPrisma: prismaServices.length,
      totalSanity: sanityServices?.length || 0,
      inBoth: result.inBoth.length,
      onlyInPrisma: result.onlyInPrisma.length,
      onlyInSanity: result.onlyInSanity.length,
    });

    return result;
  } catch (error) {
    logger.error("Service reconciliation failed", error);

    // Return partial results even on error
    return result;
  }
}
