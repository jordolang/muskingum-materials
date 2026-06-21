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
import { captureError, addBreadcrumb } from "@/lib/monitoring";
import {
  PRODUCT_FIELD_MAP,
  SERVICE_FIELD_MAP,
  prismaToSanityDocument,
  getSanityOwnedFields,
} from "./field-mapping";

/**
 * Minimal Sanity document type with required fields
 */
interface SanityDocumentStub {
  _id: string;
  _type: string;
  [key: string]: unknown;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  documentId?: string;
  error?: string;
  dryRun?: boolean;
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
 * @param dryRun - If true, validate and prepare the sync but don't write to Sanity
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
  dryRun = false,
): Promise<SyncResult> {
  const startTime = Date.now();
  const documentId = `product.${product.id}`;

  logger.info("Starting product sync to Sanity", {
    operationType: "sync_product",
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    documentId,
    dryRun,
    timestamp: new Date().toISOString(),
  });

  addBreadcrumb("Starting product sync", "sync", {
    productId: product.id,
    productSlug: product.slug,
    documentId,
    dryRun,
  });

  try {
    // Skip sync if Sanity credentials are not configured
    if (!hasSanityCredentials()) {
      logger.warn("Sanity sync skipped - no API token configured", {
        operationType: "sync_product",
        productId: product.id,
        productSlug: product.slug,
        reason: "missing_credentials",
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

    // Fetch existing Sanity document to preserve Sanity-owned fields
    let existingDoc: Record<string, unknown> | null = null;
    let isNewDocument = true;
    try {
      existingDoc = await previewClient.fetch(
        `*[_type == "product" && _id == $id][0]`,
        { id: documentId },
      );
      isNewDocument = !existingDoc;

      logger.info("Fetched existing Sanity document", {
        operationType: "sync_product",
        documentId,
        productSlug: product.slug,
        exists: !!existingDoc,
        isNewDocument,
      });
    } catch (error) {
      logger.warn("Failed to fetch existing Sanity document", {
        operationType: "sync_product",
        documentId,
        productSlug: product.slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Merge: Start with Prisma-owned fields
    const mergedDoc = { ...prismaFields } as SanityDocumentStub;

    // Preserve Sanity-owned fields from existing document
    let preservedFieldCount = 0;
    if (existingDoc) {
      const sanityOwnedFields = getSanityOwnedFields(PRODUCT_FIELD_MAP);

      for (const mapping of sanityOwnedFields) {
        const existingValue = getNestedValue(existingDoc, mapping.sanityField);

        // Only preserve if the field actually exists in Sanity
        if (existingValue !== undefined) {
          preservedFieldCount++;
          // Handle nested fields (e.g., 'image.alt')
          const fieldParts = mapping.sanityField.split(".");
          if (fieldParts.length > 1) {
            let current: Record<string, unknown> = mergedDoc;
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

      logger.info("Preserved Sanity-owned fields", {
        operationType: "sync_product",
        documentId,
        productSlug: product.slug,
        preservedFieldCount,
      });
    }

    // Write to Sanity using createOrReplace (upsert behavior)
    if (!dryRun) {
      await previewClient.createOrReplace(mergedDoc);
    }

    const duration = Date.now() - startTime;

    logger.info(
      dryRun
        ? "Product sync validated (dry-run mode)"
        : "Product synced to Sanity successfully",
      {
        operationType: "sync_product",
        productId: product.id,
        documentId,
        productName: product.name,
        productSlug: product.slug,
        isNewDocument,
        preservedFieldCount,
        dryRun,
        durationMs: duration,
        timestamp: new Date().toISOString(),
      }
    );

    return {
      success: true,
      documentId,
      dryRun,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Failed to sync product to Sanity", error, {
      operationType: "sync_product",
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      documentId,
      durationMs: duration,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    // Capture error in Sentry with context
    captureError(
      error instanceof Error ? error : new Error(String(error)),
      {
        operationType: "sync_product",
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        documentId,
        durationMs: duration,
      }
    );

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
 * @param dryRun - If true, validate and prepare the sync but don't write to Sanity
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
  dryRun = false,
): Promise<SyncResult> {
  const startTime = Date.now();
  const documentId = `service.${service.id}`;

  logger.info("Starting service sync to Sanity", {
    operationType: "sync_service",
    serviceId: service.id,
    serviceTitle: service.title,
    serviceSlug: service.slug,
    documentId,
    dryRun,
    timestamp: new Date().toISOString(),
  });

  addBreadcrumb("Starting service sync", "sync", {
    serviceId: service.id,
    serviceSlug: service.slug,
    documentId,
    dryRun,
  });

  try {
    // Skip sync if Sanity credentials are not configured
    if (!hasSanityCredentials()) {
      logger.warn("Sanity sync skipped - no API token configured", {
        operationType: "sync_service",
        serviceId: service.id,
        serviceSlug: service.slug,
        reason: "missing_credentials",
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

    // Fetch existing Sanity document to preserve Sanity-owned fields
    let existingDoc: Record<string, unknown> | null = null;
    let isNewDocument = true;
    try {
      existingDoc = await previewClient.fetch(
        `*[_type == "service" && _id == $id][0]`,
        { id: documentId },
      );
      isNewDocument = !existingDoc;

      logger.info("Fetched existing Sanity document", {
        operationType: "sync_service",
        documentId,
        serviceSlug: service.slug,
        exists: !!existingDoc,
        isNewDocument,
      });
    } catch (error) {
      logger.warn("Failed to fetch existing Sanity document", {
        operationType: "sync_service",
        documentId,
        serviceSlug: service.slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Merge: Start with Prisma-owned fields
    const mergedDoc = { ...prismaFields } as SanityDocumentStub;

    // Preserve Sanity-owned fields from existing document
    let preservedFieldCount = 0;
    if (existingDoc) {
      const sanityOwnedFields = getSanityOwnedFields(SERVICE_FIELD_MAP);

      for (const mapping of sanityOwnedFields) {
        const existingValue = getNestedValue(existingDoc, mapping.sanityField);

        // Only preserve if the field actually exists in Sanity
        if (existingValue !== undefined) {
          preservedFieldCount++;
          // Handle nested fields (e.g., 'image.alt')
          const fieldParts = mapping.sanityField.split(".");
          if (fieldParts.length > 1) {
            let current: Record<string, unknown> = mergedDoc;
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

      logger.info("Preserved Sanity-owned fields", {
        operationType: "sync_service",
        documentId,
        serviceSlug: service.slug,
        preservedFieldCount,
      });
    }

    // Write to Sanity using createOrReplace (upsert behavior)
    if (!dryRun) {
      await previewClient.createOrReplace(mergedDoc);
    }

    const duration = Date.now() - startTime;

    logger.info(
      dryRun
        ? "Service sync validated (dry-run mode)"
        : "Service synced to Sanity successfully",
      {
        operationType: "sync_service",
        serviceId: service.id,
        documentId,
        serviceTitle: service.title,
        serviceSlug: service.slug,
        isNewDocument,
        preservedFieldCount,
        dryRun,
        durationMs: duration,
        timestamp: new Date().toISOString(),
      }
    );

    return {
      success: true,
      documentId,
      dryRun,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Failed to sync service to Sanity", error, {
      operationType: "sync_service",
      serviceId: service.id,
      serviceTitle: service.title,
      serviceSlug: service.slug,
      documentId,
      durationMs: duration,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    // Capture error in Sentry with context
    captureError(
      error instanceof Error ? error : new Error(String(error)),
      {
        operationType: "sync_service",
        serviceId: service.id,
        serviceTitle: service.title,
        serviceSlug: service.slug,
        documentId,
        durationMs: duration,
      }
    );

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
  dryRun?: boolean;
}

/**
 * Syncs all Prisma products to Sanity CMS
 *
 * @param dryRun - If true, validate and prepare all syncs but don't write to Sanity
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
export async function syncAllProducts(
  dryRun = false,
): Promise<BulkSyncResult> {
  const startTime = Date.now();

  const result: BulkSyncResult = {
    total: 0,
    successful: 0,
    failed: 0,
    errors: [],
    dryRun,
  };

  try {
    logger.info("Starting bulk product sync", {
      operationType: "bulk_sync_products",
      dryRun,
      timestamp: new Date().toISOString(),
    });

    addBreadcrumb("Starting bulk product sync", "sync", {
      operationType: "bulk_sync_products",
      dryRun,
    });

    // Fetch all products from Prisma
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
    });

    result.total = products.length;

    logger.info("Fetched products from Prisma", {
      operationType: "bulk_sync_products",
      totalProducts: products.length,
      productSlugs: products.map((p) => p.slug),
    });

    // Sync each product individually, continuing even if one fails
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      logger.info("Processing product", {
        operationType: "bulk_sync_products",
        progress: `${i + 1}/${products.length}`,
        productId: product.id,
        productSlug: product.slug,
        dryRun,
      });

      const syncResult = await syncProductToSanity(product, dryRun);

      if (syncResult.success) {
        result.successful++;
      } else {
        result.failed++;
        result.errors.push({
          id: product.id,
          name: product.name,
          error: syncResult.error || "Unknown error",
        });

        logger.warn("Product sync failed in bulk operation", {
          operationType: "bulk_sync_products",
          productId: product.id,
          productSlug: product.slug,
          error: syncResult.error,
        });
      }
    }

    const duration = Date.now() - startTime;

    logger.info("Bulk product sync completed", {
      operationType: "bulk_sync_products",
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      errorCount: result.errors.length,
      dryRun,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Bulk product sync failed", error, {
      operationType: "bulk_sync_products",
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      durationMs: duration,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    // Capture catastrophic bulk sync error in Sentry
    captureError(
      error instanceof Error ? error : new Error(String(error)),
      {
        operationType: "bulk_sync_products",
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        durationMs: duration,
      }
    );

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
 * @param dryRun - If true, validate and prepare all syncs but don't write to Sanity
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
export async function syncAllServices(
  dryRun = false,
): Promise<BulkSyncResult> {
  const startTime = Date.now();

  const result: BulkSyncResult = {
    total: 0,
    successful: 0,
    failed: 0,
    errors: [],
    dryRun,
  };

  try {
    logger.info("Starting bulk service sync", {
      operationType: "bulk_sync_services",
      dryRun,
      timestamp: new Date().toISOString(),
    });

    addBreadcrumb("Starting bulk service sync", "sync", {
      operationType: "bulk_sync_services",
      dryRun,
    });

    // Fetch all services from Prisma
    const services = await prisma.service.findMany({
      orderBy: { title: "asc" },
    });

    result.total = services.length;

    logger.info("Fetched services from Prisma", {
      operationType: "bulk_sync_services",
      totalServices: services.length,
      serviceSlugs: services.map((s) => s.slug),
    });

    // Sync each service individually, continuing even if one fails
    for (let i = 0; i < services.length; i++) {
      const service = services[i];

      logger.info("Processing service", {
        operationType: "bulk_sync_services",
        progress: `${i + 1}/${services.length}`,
        serviceId: service.id,
        serviceSlug: service.slug,
        dryRun,
      });

      const syncResult = await syncServiceToSanity(service, dryRun);

      if (syncResult.success) {
        result.successful++;
      } else {
        result.failed++;
        result.errors.push({
          id: service.id,
          name: service.title,
          error: syncResult.error || "Unknown error",
        });

        logger.warn("Service sync failed in bulk operation", {
          operationType: "bulk_sync_services",
          serviceId: service.id,
          serviceSlug: service.slug,
          error: syncResult.error,
        });
      }
    }

    const duration = Date.now() - startTime;

    logger.info("Bulk service sync completed", {
      operationType: "bulk_sync_services",
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      errorCount: result.errors.length,
      dryRun,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Bulk service sync failed", error, {
      operationType: "bulk_sync_services",
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      durationMs: duration,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    // Capture catastrophic bulk sync error in Sentry
    captureError(
      error instanceof Error ? error : new Error(String(error)),
      {
        operationType: "bulk_sync_services",
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        durationMs: duration,
      }
    );

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
