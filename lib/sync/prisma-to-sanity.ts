/**
 * Prisma → Sanity Sync Logic
 *
 * Syncs Prisma-owned product fields to Sanity CMS while preserving
 * Sanity-owned marketing content and rich media.
 *
 * Architecture:
 * 1. Transform Prisma product using field mappings
 * 2. Fetch existing Sanity document (if it exists)
 * 3. Merge Prisma-owned fields with existing Sanity-owned fields
 * 4. Use createOrReplace to update/create the document
 *
 * @see lib/sync/field-mapping.ts for field ownership rules
 */

import type { Product } from "@prisma/client";
import { logger } from "@/lib/logger";
import { previewClient } from "@/lib/sanity/client";
import {
  PRODUCT_FIELD_MAP,
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
