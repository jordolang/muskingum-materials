/**
 * Field Mapping Configuration for Prisma ↔ Sanity Sync
 *
 * This module defines field ownership and mapping between Prisma (PostgreSQL)
 * and Sanity CMS for Product and Service models.
 *
 * Architecture:
 * - Prisma owns catalog, pricing, inventory, and transactional fields
 * - Sanity owns marketing content, rich media, and SEO metadata
 * - Sync is one-way: Prisma → Sanity (Prisma-owned fields only)
 *
 * @see docs/sync-field-ownership.md for detailed ownership rules
 */

/**
 * Field mapping entry defining how a Prisma field maps to Sanity
 */
export interface FieldMapping {
  /** Field name in Prisma model */
  prismaField: string;
  /** Field name in Sanity document (can be nested path like 'seo.metaTitle') */
  sanityField: string;
  /** Owner of this field - determines sync direction */
  owner: 'prisma' | 'sanity';
  /** If true, this field is synced from Prisma to Sanity */
  syncToSanity: boolean;
  /** Optional transformation function for type conversion */
  transform?: (value: unknown) => unknown;
}

/**
 * Product field mappings from Prisma to Sanity
 *
 * Prisma-owned fields (syncToSanity: true) are written during sync.
 * Sanity-owned fields (syncToSanity: false) are preserved in Sanity.
 */
export const PRODUCT_FIELD_MAP: FieldMapping[] = [
  // Identifiers (Prisma-owned)
  {
    prismaField: 'id',
    sanityField: '_id',
    owner: 'prisma',
    syncToSanity: true,
    transform: (id: unknown) => `product.${id}`,
  },
  {
    prismaField: 'slug',
    sanityField: 'slug.current',
    owner: 'prisma',
    syncToSanity: true,
  },

  // Catalog Fields (Prisma-owned)
  {
    prismaField: 'name',
    sanityField: 'name',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'category',
    sanityField: 'category',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'price',
    sanityField: 'price',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'unit',
    sanityField: 'unit',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'stockStatus',
    sanityField: 'stockStatus',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'seasonalMessage',
    sanityField: 'seasonalMessage',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'active',
    sanityField: 'active',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'sortOrder',
    sanityField: 'sortOrder',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'featured',
    sanityField: 'featured',
    owner: 'prisma',
    syncToSanity: true,
  },

  // Market Pricing (Prisma-owned)
  {
    prismaField: 'marketPriceLowPerTon',
    sanityField: 'marketPriceLowPerTon',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'marketPriceHighPerTon',
    sanityField: 'marketPriceHighPerTon',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'marketPriceLowPerYard',
    sanityField: 'marketPriceLowPerYard',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'marketPriceHighPerYard',
    sanityField: 'marketPriceHighPerYard',
    owner: 'prisma',
    syncToSanity: true,
  },

  // Physical Properties (Prisma-owned)
  {
    prismaField: 'sizeDescription',
    sanityField: 'sizeDescription',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'colorDescription',
    sanityField: 'colorDescription',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'densityLow',
    sanityField: 'densityLow',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'densityHigh',
    sanityField: 'densityHigh',
    owner: 'prisma',
    syncToSanity: true,
  },

  // Structured Content Arrays (Prisma-owned)
  {
    prismaField: 'bestFor',
    sanityField: 'bestFor',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'notFor',
    sanityField: 'notFor',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'commonUses',
    sanityField: 'commonUses',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'pros',
    sanityField: 'pros',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'cons',
    sanityField: 'cons',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'altNames',
    sanityField: 'altNames',
    owner: 'prisma',
    syncToSanity: true,
  },

  // Marketing Fields (Sanity-owned - NOT synced)
  {
    prismaField: 'description',
    sanityField: 'description',
    owner: 'sanity',
    syncToSanity: false,
  },
  {
    prismaField: 'shortDescription',
    sanityField: 'shortDescription',
    owner: 'sanity',
    syncToSanity: false,
  },
  {
    prismaField: 'imageUrl',
    sanityField: 'image',
    owner: 'sanity',
    syncToSanity: false,
  },
  {
    prismaField: 'imageAlt',
    sanityField: 'image.alt',
    owner: 'sanity',
    syncToSanity: false,
  },
  {
    prismaField: 'metaTitle',
    sanityField: 'metaTitle',
    owner: 'sanity',
    syncToSanity: false,
  },
  {
    prismaField: 'metaDescription',
    sanityField: 'metaDescription',
    owner: 'sanity',
    syncToSanity: false,
  },

  // Metadata (Prisma-owned)
  {
    prismaField: 'createdAt',
    sanityField: '_createdAt',
    owner: 'prisma',
    syncToSanity: true,
    transform: (date: unknown) => (date instanceof Date ? date.toISOString() : date),
  },
  {
    prismaField: 'updatedAt',
    sanityField: '_updatedAt',
    owner: 'prisma',
    syncToSanity: true,
    transform: (date: unknown) => (date instanceof Date ? date.toISOString() : date),
  },
];

/**
 * Service field mappings from Prisma to Sanity
 *
 * Services have fewer fields than Products - mainly catalog fields
 * and basic marketing content.
 */
export const SERVICE_FIELD_MAP: FieldMapping[] = [
  // Identifiers (Prisma-owned)
  {
    prismaField: 'id',
    sanityField: '_id',
    owner: 'prisma',
    syncToSanity: true,
    transform: (id: unknown) => `service.${id}`,
  },
  {
    prismaField: 'slug',
    sanityField: 'slug.current',
    owner: 'prisma',
    syncToSanity: true,
  },

  // Catalog Fields (Prisma-owned)
  {
    prismaField: 'title',
    sanityField: 'title',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'sortOrder',
    sanityField: 'sortOrder',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'active',
    sanityField: 'active',
    owner: 'prisma',
    syncToSanity: true,
  },
  {
    prismaField: 'features',
    sanityField: 'features',
    owner: 'prisma',
    syncToSanity: true,
  },

  // Marketing Fields (Sanity-owned - NOT synced)
  {
    prismaField: 'description',
    sanityField: 'description',
    owner: 'sanity',
    syncToSanity: false,
  },
  {
    prismaField: 'icon',
    sanityField: 'icon',
    owner: 'sanity',
    syncToSanity: false,
  },

  // Metadata (Prisma-owned)
  {
    prismaField: 'createdAt',
    sanityField: '_createdAt',
    owner: 'prisma',
    syncToSanity: true,
    transform: (date: unknown) => (date instanceof Date ? date.toISOString() : date),
  },
  {
    prismaField: 'updatedAt',
    sanityField: '_updatedAt',
    owner: 'prisma',
    syncToSanity: true,
    transform: (date: unknown) => (date instanceof Date ? date.toISOString() : date),
  },
];

/**
 * Get only Prisma-owned fields for a given model
 * These are the fields that should be synced from Prisma to Sanity
 */
export function getPrismaOwnedFields(fieldMap: FieldMapping[]): FieldMapping[] {
  return fieldMap.filter((mapping) => mapping.syncToSanity);
}

/**
 * Get only Sanity-owned fields for a given model
 * These fields are never overwritten during sync
 */
export function getSanityOwnedFields(fieldMap: FieldMapping[]): FieldMapping[] {
  return fieldMap.filter((mapping) => !mapping.syncToSanity);
}

/**
 * Get Prisma field names that should be synced
 */
export function getPrismaFieldNames(fieldMap: FieldMapping[]): string[] {
  return getPrismaOwnedFields(fieldMap).map((m) => m.prismaField);
}

/**
 * Get Sanity field names that are owned by Sanity
 */
export function getSanityFieldNames(fieldMap: FieldMapping[]): string[] {
  return getSanityOwnedFields(fieldMap).map((m) => m.sanityField);
}

/**
 * Convert a Prisma record to a Sanity document
 * Only includes Prisma-owned fields
 */
export function prismaToSanityDocument<T extends Record<string, unknown>>(
  prismaRecord: T,
  fieldMap: FieldMapping[],
  docType: 'product' | 'service'
): Record<string, unknown> {
  const sanityDoc: Record<string, unknown> = {
    _type: docType,
  };

  const prismaOwnedFields = getPrismaOwnedFields(fieldMap);

  for (const mapping of prismaOwnedFields) {
    const value = prismaRecord[mapping.prismaField];

    // Skip undefined/null values unless they're explicitly set
    if (value === undefined) continue;

    // Apply transformation if defined
    const transformedValue = mapping.transform ? mapping.transform(value) : value;

    // Handle nested Sanity fields (e.g., 'slug.current')
    const fieldParts = mapping.sanityField.split('.');
    if (fieldParts.length > 1) {
      let current = sanityDoc;
      for (let i = 0; i < fieldParts.length - 1; i++) {
        const part = fieldParts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
      current[fieldParts[fieldParts.length - 1]] = transformedValue;
    } else {
      sanityDoc[mapping.sanityField] = transformedValue;
    }
  }

  return sanityDoc;
}
