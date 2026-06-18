/**
 * Prisma → Sanity Sync Logic
 *
 * Syncs Prisma-owned product and service fields to Sanity CMS while preserving
 * Sanity-owned marketing content and rich media.
 *
 * Architecture:
 * 1. Transform Prisma product/service using field mappings
 * 2. Fetch existing Sanity document (if it exists)
 * 3. Merge Prisma-owned fields with existing Sanity-owned fields
 * 4. Use createOrReplace to update/create the document
 *
 * @see lib/sync/field-mapping.ts for field ownership rules
 */

import type { Product, Service } from "@prisma/client";
import { logger } from "@/lib/logger";
import { previewClient } from "@/lib/sanity/client";
import { prisma } from "@/lib/prisma";
import {
  PRODUCT_FIELD_MAP,
  SERVICE_FIELD_MAP,
  prismaToSanityDocument,
  getSanityOwnedFields,
} from "./field-mapping";

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

/**
 * Extracts nested field value from an object using dot notation
 * @param obj - Source object
 * @param path - Dot-separated path (e.g., 'slug.current')
 * @returns The value at the path, or undefined if not found
 */
function getNestedValue(
  obj: Record<string, unknown>,
  path: string,
): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Checks if Sanity credentials are configured
 */
function hasSanityCredentials(): boolean {
  const token = process.env.SANITY_API_TOKEN;
  return Boolean(token && token.trim() !== "");
}

/**
 * Syncs a Prisma product to Sanity CMS
 *
 * @param product - Prisma product to sync
 * @returns Result indicating success or failure
 *
 * @example
 * ```ts
 * import { syncProductToSanity } from "@/lib/sync/prisma-to-sanity";
 *
 * const product = await prisma.product.findUnique({ where: { id: "123" } });
 * const result = await syncProductToSanity(product);
 *
 * if (result.success) {
 *   console.log(`Synced product to ${result.documentId}`);
 * } else {
 *   console.error(`Sync failed: ${result.error}`);
 * }
 * ```
 */
export async function syncProductToSanity(
  product: Product,
): Promise<SyncResult> {
  try {
    // Skip sync if Sanity credentials are not configured
    if (!hasSanityCredentials()) {
      logger.warn("Sanity sync skipped - no API token configured", {
        productId: product.id,
      });
      return {
        success: false,
        error: "SANITY_API_TOKEN not configured",
      };
    }

    // Transform Prisma product to Sanity document (Prisma-owned fields only)
    const prismaFields = prismaToSanityDocument(
      product as Record<string, unknown>,
      PRODUCT_FIELD_MAP,
      "product",
    );

    const documentId = `product.${product.id}`;

    // Fetch existing Sanity document to preserve Sanity-owned fields
    let existingDoc: Record<string, unknown> | null = null;
    try {
      existingDoc = await previewClient.fetch(
        `*[_type == "product" && _id == $id][0]`,
        { id: documentId },
      );
    } catch (error) {
      logger.warn("Failed to fetch existing Sanity document", {
        documentId,
        error,
      });
    }

    // Merge: Start with Prisma-owned fields
    const mergedDoc: Record<string, unknown> = { ...prismaFields };

    // Preserve Sanity-owned fields from existing document
    if (existingDoc) {
      const sanityOwnedFields = getSanityOwnedFields(PRODUCT_FIELD_MAP);

      for (const mapping of sanityOwnedFields) {
        const existingValue = getNestedValue(existingDoc, mapping.sanityField);

        // Only preserve if the field actually exists in Sanity
        if (existingValue !== undefined) {
          // Handle nested fields (e.g., 'image.alt')
          const fieldParts = mapping.sanityField.split(".");
          if (fieldParts.length > 1) {
            let current = mergedDoc;
            for (let i = 0; i < fieldParts.length - 1; i++) {
              const part = fieldParts[i];
              if (!current[part]) {
                current[part] = {};
              }
              current = current[part] as Record<string, unknown>;
            }
            current[fieldParts[fieldParts.length - 1]] = existingValue;
          } else {
            mergedDoc[mapping.sanityField] = existingValue;
          }
        }
      }
    }

    // Write to Sanity using createOrReplace (upsert behavior)
    await previewClient.createOrReplace(mergedDoc as any);

    logger.info("Product synced to Sanity", {
      productId: product.id,
      documentId,
      productName: product.name,
    });

    return {
      success: true,
      documentId,
    };
  } catch (error) {
    logger.error("Failed to sync product to Sanity", error, {
      productId: product.id,
      productName: product.name,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Syncs a Prisma service to Sanity CMS
 *
 * @param service - Prisma service to sync
 * @returns Result indicating success or failure
 *
 * @example
 * ```ts
 * import { syncServiceToSanity } from "@/lib/sync/prisma-to-sanity";
 *
 * const service = await prisma.service.findUnique({ where: { id: "123" } });
 * const result = await syncServiceToSanity(service);
 *
 * if (result.success) {
 *   console.log(`Synced service to ${result.documentId}`);
 * } else {
 *   console.error(`Sync failed: ${result.error}`);
 * }
 * ```
 */
export async function syncServiceToSanity(
  service: Service,
): Promise<SyncResult> {
  try {
    // Skip sync if Sanity credentials are not configured
    if (!hasSanityCredentials()) {
      logger.warn("Sanity sync skipped - no API token configured", {
        serviceId: service.id,
      });
      return {
        success: false,
        error: "SANITY_API_TOKEN not configured",
      };
    }

    // Transform Prisma service to Sanity document (Prisma-owned fields only)
    const prismaFields = prismaToSanityDocument(
      service as Record<string, unknown>,
      SERVICE_FIELD_MAP,
      "service",
    );

    const documentId = `service.${service.id}`;

    // Fetch existing Sanity document to preserve Sanity-owned fields
    let existingDoc: Record<string, unknown> | null = null;
    try {
      existingDoc = await previewClient.fetch(
        `*[_type == "service" && _id == $id][0]`,
        { id: documentId },
      );
    } catch (error) {
      logger.warn("Failed to fetch existing Sanity document", {
        documentId,
        error,
      });
    }

    // Merge: Start with Prisma-owned fields
    const mergedDoc: Record<string, unknown> = { ...prismaFields };

    // Preserve Sanity-owned fields from existing document
    if (existingDoc) {
      const sanityOwnedFields = getSanityOwnedFields(SERVICE_FIELD_MAP);

      for (const mapping of sanityOwnedFields) {
        const existingValue = getNestedValue(existingDoc, mapping.sanityField);

        // Only preserve if the field actually exists in Sanity
        if (existingValue !== undefined) {
          // Handle nested fields (e.g., 'image.alt')
          const fieldParts = mapping.sanityField.split(".");
          if (fieldParts.length > 1) {
            let current = mergedDoc;
            for (let i = 0; i < fieldParts.length - 1; i++) {
              const part = fieldParts[i];
              if (!current[part]) {
                current[part] = {};
              }
              current = current[part] as Record<string, unknown>;
            }
            current[fieldParts[fieldParts.length - 1]] = existingValue;
          } else {
            mergedDoc[mapping.sanityField] = existingValue;
          }
        }
      }
    }

    // Write to Sanity using createOrReplace (upsert behavior)
    await previewClient.createOrReplace(mergedDoc as any);

    logger.info("Service synced to Sanity", {
      serviceId: service.id,
      documentId,
      serviceTitle: service.title,
    });

    return {
      success: true,
      documentId,
    };
  } catch (error) {
    logger.error("Failed to sync service to Sanity", error, {
      serviceId: service.id,
      serviceTitle: service.title,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Result of a bulk sync operation
 */
export interface BulkSyncResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ id: string; name: string; error: string }>;
}

/**
 * Syncs all Prisma products to Sanity CMS
 *
 * @returns Summary of sync results including success/failure counts
 *
 * @example
 * ```ts
 * import { syncAllProducts } from "@/lib/sync/prisma-to-sanity";
 *
 * const result = await syncAllProducts();
 * console.log(`Synced ${result.successful}/${result.total} products`);
 * ```
 */
export async function syncAllProducts(): Promise<BulkSyncResult> {
  const result: BulkSyncResult = {
    total: 0,
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Fetch all products from Prisma
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
    });

    result.total = products.length;

    logger.info("Starting bulk product sync", {
      totalProducts: products.length,
    });

    // Sync each product individually, continuing even if one fails
    for (const product of products) {
      const syncResult = await syncProductToSanity(product);

      if (syncResult.success) {
        result.successful++;
      } else {
        result.failed++;
        result.errors.push({
          id: product.id,
          name: product.name,
          error: syncResult.error || "Unknown error",
        });
      }
    }

    logger.info("Bulk product sync completed", {
      total: result.total,
      successful: result.successful,
      failed: result.failed,
    });

    return result;
  } catch (error) {
    logger.error("Bulk product sync failed", error);

    // Return partial results even on catastrophic failure
    return {
      ...result,
      errors: [
        ...result.errors,
        {
          id: "bulk-sync",
          name: "Bulk Sync Operation",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      ],
    };
  }
}

/**
 * Syncs all Prisma services to Sanity CMS
 *
 * @returns Summary of sync results including success/failure counts
 *
 * @example
 * ```ts
 * import { syncAllServices } from "@/lib/sync/prisma-to-sanity";
 *
 * const result = await syncAllServices();
 * console.log(`Synced ${result.successful}/${result.total} services`);
 * ```
 */
export async function syncAllServices(): Promise<BulkSyncResult> {
  const result: BulkSyncResult = {
    total: 0,
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Fetch all services from Prisma
    const services = await prisma.service.findMany({
      orderBy: { title: "asc" },
    });

    result.total = services.length;

    logger.info("Starting bulk service sync", {
      totalServices: services.length,
    });

    // Sync each service individually, continuing even if one fails
    for (const service of services) {
      const syncResult = await syncServiceToSanity(service);

      if (syncResult.success) {
        result.successful++;
      } else {
        result.failed++;
        result.errors.push({
          id: service.id,
          name: service.title,
          error: syncResult.error || "Unknown error",
        });
      }
    }

    logger.info("Bulk service sync completed", {
      total: result.total,
      successful: result.successful,
      failed: result.failed,
    });

    return result;
  } catch (error) {
    logger.error("Bulk service sync failed", error);

    // Return partial results even on catastrophic failure
    return {
      ...result,
      errors: [
        ...result.errors,
        {
          id: "bulk-sync",
          name: "Bulk Sync Operation",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      ],
    };
  }
}
