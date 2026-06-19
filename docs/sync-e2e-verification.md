# End-to-End Sync Verification Guide

This document provides step-by-step instructions for manually verifying the Prisma ↔ Sanity content sync system.

## Prerequisites

Before starting verification:

- [ ] Dev server running: `npm run dev`
- [ ] Prisma database accessible (check `DATABASE_URL` in `.env.local`)
- [ ] Sanity credentials configured:
  - `NEXT_PUBLIC_SANITY_PROJECT_ID`
  - `NEXT_PUBLIC_SANITY_DATASET`
  - `SANITY_API_TOKEN` (with write permissions)
  - `SANITY_REVALIDATE_SECRET` (for API authentication)
- [ ] Sanity Studio accessible at http://localhost:3000/studio

## Automated Verification

Run the automated E2E test script:

```bash
npx tsx test-sync-e2e.ts
```

This script will:
1. Create a test product in Prisma
2. Test dry-run sync mode
3. Sync the product to Sanity
4. Verify the product appears in Sanity
5. Run reconciliation
6. Clean up test data

## Manual Verification Steps

### Step 1: Verify Sanity Studio Access

1. Open http://localhost:3000/studio
2. Verify you can log in
3. Navigate to Products section
4. Confirm you see the product schema

**Expected Result:** Sanity Studio loads and shows product schema with all fields.

---

### Step 2: Create Test Product in Prisma

Option A: Use Prisma Studio

```bash
npm run db:studio
```

Then create a product with:
- **slug**: `test-sync-product`
- **name**: `Test Sync Product`
- **category**: `Aggregates`
- **description**: `Test product for sync verification`
- **price**: `50.00`
- **unit**: `ton`
- **stockStatus**: `IN_STOCK`
- **active**: `true`

Option B: Use the Prisma client directly

```typescript
// In a Node.js script or Next.js API route
const product = await prisma.product.create({
  data: {
    slug: "test-sync-product",
    name: "Test Sync Product",
    category: "Aggregates",
    description: "Test product for sync verification",
    price: 50.00,
    unit: "ton",
    stockStatus: "IN_STOCK",
    active: true,
  }
});
```

**Expected Result:** Product created successfully in Prisma database.

---

### Step 3: Test Dry-Run Sync

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_SANITY_REVALIDATE_SECRET",
    "type": "products",
    "dryRun": true
  }'
```

**Expected Result:**
- Status 200
- Response shows `"dryRun": true`
- Response shows products validated but not synced
- No changes in Sanity

---

### Step 4: Sync Product to Sanity

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_SANITY_REVALIDATE_SECRET",
    "type": "products",
    "dryRun": false
  }'
```

**Expected Result:**
- Status 200
- Response shows `"successful": 1` (or more)
- Response shows `"failed": 0`
- Check server logs for "Syncing product" messages

---

### Step 5: Verify Product in Sanity Studio

1. Open http://localhost:3000/studio
2. Navigate to Products
3. Find "Test Sync Product"
4. Verify Prisma-owned fields are synced:
   - ✅ Name: "Test Sync Product"
   - ✅ Slug: "test-sync-product"
   - ✅ Category: "Aggregates"
   - ✅ Price: 50.00
   - ✅ Active: true
5. Note that Prisma-owned fields should be read-only (grayed out)

**Expected Result:** Product appears in Sanity with all Prisma-owned fields synced correctly.

---

### Step 6: Test Sanity-Owned Field Preservation

1. In Sanity Studio, edit "Test Sync Product"
2. Add/modify a Sanity-owned field:
   - **marketingDescription**: "This is a marketing description added in Sanity"
   - **imageGallery**: Upload a test image
   - **seoKeywords**: Add some keywords
3. Click **Publish**
4. Re-run the sync (repeat Step 4)
5. Reload the product in Sanity Studio
6. Verify your marketing description is still there

**Expected Result:** Sanity-owned fields are preserved and NOT overwritten by sync.

---

### Step 7: Test Reconciliation

```bash
curl -X POST http://localhost:3000/api/sync/reconcile \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_SANITY_REVALIDATE_SECRET",
    "type": "all"
  }'
```

**Expected Result:**
- Status 200
- Response shows counts for:
  - `inBoth`: Products that exist in both stores
  - `onlyInPrisma`: Products needing sync
  - `onlyInSanity`: Orphaned products
- All products should be in `inBoth` after successful sync

---

### Step 8: Test Service Sync

Repeat steps 2-6 for services:

1. Create a test service in Prisma:
   - **slug**: `test-sync-service`
   - **title**: `Test Sync Service`
   - **features**: `["Feature 1", "Feature 2"]`
   - **active**: `true`

2. Sync services:
   ```bash
   curl -X POST http://localhost:3000/api/sync \
     -H "Content-Type: application/json" \
     -d '{
       "secret": "YOUR_SANITY_REVALIDATE_SECRET",
       "type": "services"
     }'
   ```

3. Verify in Sanity Studio:
   - Service appears with Prisma-owned fields synced
   - Sanity-owned fields (description, icon) can be edited
   - Re-sync preserves Sanity-owned fields

---

### Step 9: Test Error Handling

Test various error scenarios:

1. **Invalid Secret:**
   ```bash
   curl -X POST http://localhost:3000/api/sync \
     -H "Content-Type: application/json" \
     -d '{"secret": "wrong-secret", "type": "products"}'
   ```
   **Expected:** 401 Unauthorized

2. **Invalid Type:**
   ```bash
   curl -X POST http://localhost:3000/api/sync \
     -H "Content-Type: application/json" \
     -d '{"secret": "YOUR_SECRET", "type": "invalid"}'
   ```
   **Expected:** 400 Bad Request with validation error

3. **Malformed JSON:**
   ```bash
   curl -X POST http://localhost:3000/api/sync \
     -H "Content-Type: application/json" \
     -d 'not json'
   ```
   **Expected:** 400 Bad Request

---

## Verification Checklist

After completing all steps, verify:

- [ ] Products sync from Prisma to Sanity
- [ ] Services sync from Prisma to Sanity
- [ ] Prisma-owned fields are synced correctly
- [ ] Sanity-owned fields are preserved (not overwritten)
- [ ] Dry-run mode works without making changes
- [ ] Reconciliation detects missing records
- [ ] API authentication works (rejects invalid secrets)
- [ ] Error handling works for invalid requests
- [ ] Server logs show detailed sync operations
- [ ] No console.log statements in code
- [ ] TypeScript compilation passes
- [ ] No errors in browser console

## Cleanup

After verification, clean up test data:

1. Delete test product from Prisma (via Prisma Studio or SQL)
2. Delete test product from Sanity (via Sanity Studio)
3. Delete test service from both stores
4. Run reconciliation to verify cleanup

## Troubleshooting

### Sync fails with "Server misconfiguration"

- Check that `SANITY_REVALIDATE_SECRET` is set in `.env.local`
- Verify it matches the secret used in API requests

### Product doesn't appear in Sanity

- Check server logs for error messages
- Verify `SANITY_API_TOKEN` has write permissions
- Verify Sanity project ID and dataset are correct
- Check that product has a valid slug

### Sanity-owned fields are overwritten

- Check field mapping in `lib/sync/field-mapping.ts`
- Verify fields are marked as `syncToSanity: false`
- Check sync function preserves existing Sanity fields

### Reconciliation shows unexpected results

- Verify both Prisma and Sanity are accessible
- Check that slugs match between stores (slug is the canonical identifier)
- Look for products with duplicate slugs

## Additional Resources

- [Field Ownership Map](./sync-field-ownership.md)
- [CLAUDE.md](../CLAUDE.md) - Architecture overview
- [Sync API Source](../app/api/sync/route.ts)
- [Reconciliation Source](../lib/sync/reconcile.ts)
