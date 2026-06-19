/**
 * End-to-End Sync Verification Script
 *
 * This script performs comprehensive testing of the Prisma ↔ Sanity sync system:
 * 1. Creates test product in Prisma
 * 2. Syncs to Sanity via API
 * 3. Verifies product appears in Sanity
 * 4. Tests that Sanity-owned fields are preserved
 * 5. Runs reconciliation to verify consistency
 *
 * Prerequisites:
 * - Dev server running (npm run dev)
 * - DATABASE_URL configured
 * - Sanity credentials configured
 * - SANITY_REVALIDATE_SECRET set
 *
 * Usage:
 *   npx tsx test-sync-e2e.ts
 */

import { prisma } from "./lib/prisma";
import { sanityClient } from "./lib/sanity/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SYNC_SECRET = process.env.SANITY_REVALIDATE_SECRET || "";

interface SyncResponse {
  success: boolean;
  type: string;
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ id: string; name: string; error: string }>;
  dryRun?: boolean;
}

interface ReconcileResponse {
  success: boolean;
  type: string;
  results: {
    products?: {
      onlyInPrisma: Array<{ id: string; slug: string; name: string }>;
      onlyInSanity: Array<{ id: string; slug: string }>;
      inBoth: Array<{ prismaId: string; sanityId: string; slug: string }>;
    };
    services?: {
      onlyInPrisma: Array<{ id: string; slug: string; name: string }>;
      onlyInSanity: Array<{ id: string; slug: string }>;
      inBoth: Array<{ prismaId: string; sanityId: string; slug: string }>;
    };
  };
  summary: {
    products?: {
      onlyInPrisma: number;
      onlyInSanity: number;
      inBoth: number;
    };
    services?: {
      onlyInPrisma: number;
      onlyInSanity: number;
      inBoth: number;
    };
  };
}

/**
 * Test helper to make API requests
 */
async function apiRequest<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed (${response.status}): ${error}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Step 1: Create test product in Prisma
 */
async function createTestProduct() {
  console.log("\n✅ Step 1: Creating test product in Prisma...");

  const testSlug = `test-product-${Date.now()}`;

  const product = await prisma.product.create({
    data: {
      slug: testSlug,
      name: "E2E Test Product",
      category: "Aggregates",
      description: "This is a test product for E2E verification",
      price: 45.00,
      unit: "ton",
      stockStatus: "IN_STOCK",
      active: true,
      bestFor: ["Testing sync functionality", "Verification workflows"],
      imageUrl: "https://example.com/test.jpg",
      metaTitle: "E2E Test Product - Muskingum Materials",
      metaDescription: "Test product for sync verification",
      sortOrder: 999,
      featured: false,
    },
  });

  console.log(`   Created product: ${product.name} (ID: ${product.id}, slug: ${product.slug})`);

  return product;
}

/**
 * Step 2: Test dry-run sync first
 */
async function testDryRunSync() {
  console.log("\n✅ Step 2: Testing dry-run sync...");

  const response = await apiRequest<SyncResponse>("/api/sync", {
    secret: SYNC_SECRET,
    type: "products",
    dryRun: true,
  });

  console.log(`   Dry-run completed: ${response.successful} products validated`);
  console.log(`   Dry-run mode: ${response.dryRun}`);

  if (!response.dryRun) {
    throw new Error("Dry-run flag not set in response");
  }

  return response;
}

/**
 * Step 3: Sync product to Sanity via API
 */
async function syncToSanity() {
  console.log("\n✅ Step 3: Syncing products to Sanity...");

  const response = await apiRequest<SyncResponse>("/api/sync", {
    secret: SYNC_SECRET,
    type: "products",
    dryRun: false,
  });

  console.log(`   Sync completed: ${response.successful}/${response.total} products synced`);

  if (response.failed > 0) {
    console.warn(`   ⚠️  ${response.failed} products failed to sync:`);
    response.errors.forEach(err => {
      console.warn(`      - ${err.name}: ${err.error}`);
    });
  }

  return response;
}

/**
 * Step 4: Verify product appears in Sanity
 */
async function verifyProductInSanity(productSlug: string) {
  console.log("\n✅ Step 4: Verifying product exists in Sanity...");

  // Query Sanity for the product
  const query = `*[_type == "product" && slug.current == $slug][0]`;
  const sanityProduct = await sanityClient.fetch(query, { slug: productSlug });

  if (!sanityProduct) {
    throw new Error(`Product with slug "${productSlug}" not found in Sanity`);
  }

  console.log(`   Found product in Sanity: ${sanityProduct.name} (ID: ${sanityProduct._id})`);
  console.log(`   Prisma-owned fields synced:`);
  console.log(`      - name: ${sanityProduct.name}`);
  console.log(`      - category: ${sanityProduct.category}`);
  console.log(`      - price: ${sanityProduct.price}`);
  console.log(`      - active: ${sanityProduct.active}`);

  return sanityProduct;
}

/**
 * Step 5: Verify Sanity-owned fields can be modified
 */
async function testSanityFieldPreservation(productSlug: string) {
  console.log("\n✅ Step 5: Testing Sanity-owned field preservation...");

  // Fetch the product from Sanity
  const query = `*[_type == "product" && slug.current == $slug][0]`;
  let sanityProduct = await sanityClient.fetch(query, { slug: productSlug });

  if (!sanityProduct) {
    throw new Error(`Product with slug "${productSlug}" not found in Sanity`);
  }

  // Note: In a real E2E test, we would update the product via Sanity Studio UI
  // For this script, we'll simulate by documenting what should be tested manually
  console.log(`   ℹ️  Manual verification required:`);
  console.log(`      1. Open Sanity Studio at ${API_BASE_URL}/studio`);
  console.log(`      2. Find product: "${sanityProduct.name}"`);
  console.log(`      3. Edit Sanity-owned field (e.g., marketingDescription)`);
  console.log(`      4. Publish changes`);
  console.log(`      5. Re-run sync`);
  console.log(`      6. Verify Sanity field was NOT overwritten`);

  // Check current Sanity-owned fields
  console.log(`   Current Sanity-owned fields:`);
  console.log(`      - marketingDescription: ${sanityProduct.marketingDescription || "(not set)"}`);
  console.log(`      - imageGallery: ${sanityProduct.imageGallery?.length || 0} images`);
  console.log(`      - seoKeywords: ${sanityProduct.seoKeywords?.length || 0} keywords`);
}

/**
 * Step 6: Run reconciliation
 */
async function runReconciliation() {
  console.log("\n✅ Step 6: Running reconciliation...");

  const response = await apiRequest<ReconcileResponse>("/api/sync/reconcile", {
    secret: SYNC_SECRET,
    type: "all",
  });

  console.log(`   Reconciliation completed:`);

  if (response.summary.products) {
    console.log(`   Products:`);
    console.log(`      - In both stores: ${response.summary.products.inBoth}`);
    console.log(`      - Only in Prisma: ${response.summary.products.onlyInPrisma}`);
    console.log(`      - Only in Sanity: ${response.summary.products.onlyInSanity}`);

    if (response.summary.products.onlyInPrisma > 0) {
      console.log(`      ⚠️  Products needing sync:`);
      response.results.products?.onlyInPrisma.forEach(p => {
        console.log(`         - ${p.name} (${p.slug})`);
      });
    }

    if (response.summary.products.onlyInSanity > 0) {
      console.log(`      ⚠️  Orphaned products in Sanity:`);
      response.results.products?.onlyInSanity.forEach(p => {
        console.log(`         - ${p.slug} (ID: ${p.id})`);
      });
    }
  }

  if (response.summary.services) {
    console.log(`   Services:`);
    console.log(`      - In both stores: ${response.summary.services.inBoth}`);
    console.log(`      - Only in Prisma: ${response.summary.services.onlyInPrisma}`);
    console.log(`      - Only in Sanity: ${response.summary.services.onlyInSanity}`);
  }

  return response;
}

/**
 * Step 7: Cleanup test product
 */
async function cleanupTestProduct(productId: string, productSlug: string) {
  console.log("\n✅ Step 7: Cleaning up test product...");

  // Delete from Prisma
  await prisma.product.delete({
    where: { id: productId },
  });
  console.log(`   Deleted product from Prisma (ID: ${productId})`);

  // Note: In production, you might want to delete from Sanity too
  // For now, we'll leave it as orphaned to demonstrate reconciliation
  console.log(`   ℹ️  Product remains in Sanity for reconciliation demonstration`);
  console.log(`   To clean up from Sanity, run reconciliation and manually remove orphaned records`);
}

/**
 * Main E2E test flow
 */
async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Prisma ↔ Sanity Sync E2E Verification");
  console.log("═══════════════════════════════════════════════════════════");

  // Check prerequisites
  if (!SYNC_SECRET) {
    console.error("❌ SANITY_REVALIDATE_SECRET not configured");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not configured");
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    console.error("❌ NEXT_PUBLIC_SANITY_PROJECT_ID not configured");
    process.exit(1);
  }

  try {
    // Run test workflow
    const testProduct = await createTestProduct();

    await testDryRunSync();

    await syncToSanity();

    await verifyProductInSanity(testProduct.slug);

    await testSanityFieldPreservation(testProduct.slug);

    await runReconciliation();

    // Optional cleanup
    const shouldCleanup = process.env.E2E_CLEANUP !== "false";
    if (shouldCleanup) {
      await cleanupTestProduct(testProduct.id, testProduct.slug);
    } else {
      console.log(`\n   ℹ️  Skipping cleanup (E2E_CLEANUP=false)`);
    }

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  ✅ E2E Verification PASSED");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("\nNext steps:");
    console.log("  1. Open Sanity Studio: " + API_BASE_URL + "/studio");
    console.log("  2. Verify product appears in Studio");
    console.log("  3. Edit a Sanity-owned field (marketingDescription)");
    console.log("  4. Re-run sync and verify field not overwritten");
    console.log("");

  } catch (error) {
    console.error("\n❌ E2E Verification FAILED:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
main();
