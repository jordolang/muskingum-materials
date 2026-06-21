# Prisma ↔ Sanity Field Ownership Map

This document defines the authoritative store for each field in the `Product` and `Service` models. The sync system uses this map to determine sync direction and prevent data conflicts.

## Architecture Overview

### Two-Store System

- **Prisma (PostgreSQL)**: Runtime source of truth for catalog, pricing, inventory, and transactional data
- **Sanity Studio**: Editable marketing content, rich media, and SEO metadata

### Sync Direction

**Prisma → Sanity (One-Way)**: Catalog fields flow from Prisma to Sanity automatically. Marketing fields in Sanity are never overwritten.

**Manual Edits**: 
- Catalog/pricing changes happen in Prisma (via `db:studio` or seed scripts)
- Marketing/SEO changes happen in Sanity Studio (visual editor at `/studio`)

### Sync Behavior

1. **Upsert by slug**: Sync uses `slug` as the unique identifier across both stores
2. **Partial updates**: Only Prisma-owned fields are written to Sanity; Sanity-only fields are preserved
3. **Idempotent**: Re-running sync is safe and produces the same result
4. **Conflict-free**: Field ownership prevents write conflicts

---

## Product Field Ownership

| Field | Prisma Type | Sanity Type | Owner | Sync Direction | Rationale |
|-------|-------------|-------------|-------|----------------|-----------|
| **Identifiers** |
| `id` | `String` | `_id` | Prisma | Prisma → Sanity | Prisma generates stable IDs |
| `slug` | `String` | `slug` | Prisma | Prisma → Sanity | Canonical URL identifier must be consistent |
| **Catalog Fields** |
| `name` | `String` | `name` | Prisma | Prisma → Sanity | Product name appears in orders/catalog |
| `category` | `String` | `category` | Prisma | Prisma → Sanity | Used for filtering in catalog |
| `price` | `Float?` | `price` | Prisma | Prisma → Sanity | Transactional - must match order pricing |
| `unit` | `String` | `unit` | Prisma | Prisma → Sanity | Pricing unit (ton/yard/bag) for calculations |
| `stockStatus` | `StockStatus` | `stockStatus` | Prisma | Prisma → Sanity | Inventory availability |
| `seasonalMessage` | `String?` | `seasonalMessage` | Prisma | Prisma → Sanity | Inventory-related message |
| `active` | `Boolean` | `active` | Prisma | Prisma → Sanity | Catalog visibility control |
| `sortOrder` | `Int` | `sortOrder` | Prisma | Prisma → Sanity | Catalog ordering |
| `featured` | `Boolean` | `featured` | Prisma | Prisma → Sanity | Homepage/featured product flag |
| **Market Pricing** |
| `marketPriceLowPerTon` | `Float?` | `marketPriceLowPerTon` | Prisma | Prisma → Sanity | Industry pricing data |
| `marketPriceHighPerTon` | `Float?` | `marketPriceHighPerTon` | Prisma | Prisma → Sanity | Industry pricing data |
| `marketPriceLowPerYard` | `Float?` | `marketPriceLowPerYard` | Prisma | Prisma → Sanity | Industry pricing data |
| `marketPriceHighPerYard` | `Float?` | `marketPriceHighPerYard` | Prisma | Prisma → Sanity | Industry pricing data |
| **Physical Properties** |
| `sizeDescription` | `String?` | `sizeDescription` | Prisma | Prisma → Sanity | Product specification |
| `colorDescription` | `String?` | `colorDescription` | Prisma | Prisma → Sanity | Product specification |
| `densityLow` | `Float?` | `densityLow` | Prisma | Prisma → Sanity | Calculator/conversion data |
| `densityHigh` | `Float?` | `densityHigh` | Prisma | Prisma → Sanity | Calculator/conversion data |
| **Structured Content** |
| `bestFor` | `String[]` | `bestFor` | Prisma | Prisma → Sanity | Product recommendations |
| `notFor` | `String[]` | `notFor` | Prisma | Prisma → Sanity | Product limitations |
| `commonUses` | `String[]` | `commonUses` | Prisma | Prisma → Sanity | Use case data |
| `pros` | `String[]` | `pros` | Prisma | Prisma → Sanity | Product benefits |
| `cons` | `String[]` | `cons` | Prisma | Prisma → Sanity | Product drawbacks |
| `altNames` | `String[]` | `altNames` | Prisma | Prisma → Sanity | Alternate product names |
| **Marketing Fields** |
| `description` | `String` | `description` | **Sanity** | **Sanity-Only** | Rich marketing content edited in Studio |
| `shortDescription` | `String?` | `shortDescription` | **Sanity** | **Sanity-Only** | Marketing summary |
| `imageUrl` | `String?` | `image` | **Sanity** | **Sanity-Only** | Product images managed in Sanity CMS |
| `imageAlt` | `String?` | `image.alt` | **Sanity** | **Sanity-Only** | Image accessibility text |
| `metaTitle` | `String?` | `seo.metaTitle` | **Sanity** | **Sanity-Only** | SEO title for search engines |
| `metaDescription` | `String?` | `seo.metaDescription` | **Sanity** | **Sanity-Only** | SEO description for search engines |
| **Sanity-Only Fields** |
| N/A | N/A | `gallery` | **Sanity** | **Sanity-Only** | Multi-image gallery for product |
| N/A | N/A | `relatedProducts` | **Sanity** | **Sanity-Only** | References to related products |
| N/A | N/A | `seo.ogImage` | **Sanity** | **Sanity-Only** | Social sharing image |
| **Metadata** |
| `createdAt` | `DateTime` | `_createdAt` | Prisma | Prisma → Sanity | Record creation timestamp |
| `updatedAt` | `DateTime` | `_updatedAt` | Prisma | Prisma → Sanity | Record update timestamp |

### Product Sync Notes

1. **Prisma fields are read-only in Sanity Studio**: Catalog fields display in Studio for context but cannot be edited
2. **Image handling**: Prisma stores `imageUrl` (CDN URL) but Sanity owns the actual image asset and metadata
3. **SEO fields**: Prisma has `metaTitle`/`metaDescription` for fallback but Sanity's richer SEO object is authoritative
4. **Array fields**: Sync preserves Prisma's structured arrays (bestFor, pros, etc.) as-is in Sanity

---

## Service Field Ownership

| Field | Prisma Type | Sanity Type | Owner | Sync Direction | Rationale |
|-------|-------------|-------------|-------|----------------|-----------|
| **Identifiers** |
| `id` | `String` | `_id` | Prisma | Prisma → Sanity | Prisma generates stable IDs |
| `slug` | `String` | `slug` | Prisma | Prisma → Sanity | Canonical URL identifier |
| **Catalog Fields** |
| `title` | `String` | `title` | Prisma | Prisma → Sanity | Service name appears in quotes/forms |
| `sortOrder` | `Int` | `sortOrder` | Prisma | Prisma → Sanity | Service ordering in catalog |
| `active` | `Boolean` | N/A | Prisma | Prisma → Sanity | Catalog visibility control |
| `features` | `String[]` | `features` | Prisma | Prisma → Sanity | Service feature list |
| **Marketing Fields** |
| `description` | `String` | `description` | **Sanity** | **Sanity-Only** | Rich marketing content |
| `icon` | `String?` | `icon` | **Sanity** | **Sanity-Only** | Lucide icon name for UI |
| N/A | N/A | `image` | **Sanity** | **Sanity-Only** | Service hero image |
| **Metadata** |
| `createdAt` | `DateTime` | `_createdAt` | Prisma | Prisma → Sanity | Record creation timestamp |
| `updatedAt` | `DateTime` | `_updatedAt` | Prisma | Prisma → Sanity | Record update timestamp |

### Service Sync Notes

1. **Icon field**: Prisma has `icon` but Sanity owns it for marketing flexibility
2. **Features array**: Prisma-owned because features drive quote/pricing logic
3. **Description**: Sanity-owned for rich text editing capabilities
4. **Active flag**: Prisma-only - inactive services don't sync to Sanity

---

## Special Cases & Edge Cases

### Missing Records

**Record in Prisma, not in Sanity**: Sync creates the Sanity document with Prisma fields. Marketing fields are empty until edited in Studio.

**Record in Sanity, not in Prisma**: Reconciliation reports this as a mismatch. The record is **not deleted** from Sanity (manual cleanup required). Rationale: preserves marketing work if Prisma record was accidentally deleted.

### Slug Changes

If a slug changes in Prisma:
1. A new Sanity document is created with the new slug
2. The old Sanity document remains (orphaned)
3. Reconciliation detects the orphan for manual cleanup

**Recommendation**: Never change slugs in production. If unavoidable, manually update both stores.

### Inactive Products

Products with `active: false` in Prisma:
- Still sync to Sanity (so marketing content is preserved)
- Marked as `active: false` in Sanity
- Do not appear in public catalog pages (filtered by `active: true` in queries)

### Data Type Mismatches

**String vs Rich Text**: 
- Prisma stores plain strings for `description`
- Sanity uses rich text (Portable Text)
- Sync does **not** convert Prisma strings to Sanity rich text
- Sanity descriptions must be edited in Studio

**Image URLs vs Image Assets**:
- Prisma stores `imageUrl` (string)
- Sanity stores image assets with metadata
- Sync does **not** convert URLs to assets
- Images must be uploaded in Studio

---

## Sync Implementation Rules

### Field Mapping Logic

```typescript
// Prisma → Sanity sync writes ONLY these fields:
const PRISMA_OWNED_FIELDS = [
  'slug', 'name', 'category', 'price', 'unit', 
  'stockStatus', 'seasonalMessage', 'active', 'sortOrder', 'featured',
  'marketPriceLowPerTon', 'marketPriceHighPerTon', 
  'marketPriceLowPerYard', 'marketPriceHighPerYard',
  'sizeDescription', 'colorDescription', 'densityLow', 'densityHigh',
  'bestFor', 'notFor', 'commonUses', 'pros', 'cons', 'altNames',
];

// These fields are NEVER overwritten in Sanity:
const SANITY_OWNED_FIELDS = [
  'description', 'shortDescription', 'image', 'gallery',
  'seo', 'relatedProducts', 'icon' // for services
];
```

### Upsert Behavior

```typescript
// Sync uses Sanity client.createOrReplace() with partial updates
await sanityClient.createOrReplace({
  _id: `product.${prismaProduct.slug}`,
  _type: 'product',
  ...prismaOwnedFields, // Only Prisma fields
  // Sanity fields are preserved if document exists
});
```

### Idempotency

Running sync multiple times produces the same result:
- Same Prisma data → Same Sanity document state
- No duplicate records created
- Sanity marketing fields never regress

---

## Verification Checklist

After sync runs, verify:

- [ ] Prisma product count matches Sanity product count (± reconciliation tolerance)
- [ ] Sample product has correct `price`, `name`, `category` in Sanity (Prisma fields)
- [ ] Sample product's marketing `description` and `image` unchanged in Sanity (Sanity fields)
- [ ] Reconciliation report lists any orphaned or missing records
- [ ] Sync logs show successful operations with no errors
- [ ] `active: false` products do not appear in public catalog but exist in Studio

---

## Maintenance

### Adding New Fields

When adding a field to Product/Service:

1. **Catalog/pricing field**: Add to Prisma schema, mark as Prisma-owned in this doc, add to sync logic
2. **Marketing field**: Add to Sanity schema only, mark as Sanity-owned in this doc, exclude from sync
3. **Both stores**: Add to both, document ownership in this map, update sync if Prisma-owned

### Changing Ownership

If a field's ownership needs to change:

1. Update this document first
2. Migrate existing data if needed (write a one-time script)
3. Update sync logic to respect new ownership
4. Test in staging before production

### Reconciliation Frequency

Run reconciliation:
- Weekly in production (detect orphans/mismatches)
- After bulk Prisma changes (seed scripts, migrations)
- Before major catalog updates

---

## References

- **Prisma schema**: `prisma/schema.prisma`
- **Sanity product schema**: `sanity/schemaTypes/product.ts` (created in subtask-1-2)
- **Sanity service schema**: `sanity/schemaTypes/service.ts`
- **Sync implementation**: `lib/sync/prisma-to-sanity.ts` (phase 2)
- **Field mapping config**: `lib/sync/field-mapping.ts` (phase 2)
- **CLAUDE.md**: Architecture overview and sync documentation
