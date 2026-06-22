import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { logger } from "@/lib/logger";
import {
  syncAllProducts,
  syncAllServices,
} from "@/lib/sync/prisma-to-sanity";

/** Constant-time bearer-token check that tolerates length mismatch. */
function bearerMatches(authHeader: string | null, secret: string): boolean {
  const provided = Buffer.from(authHeader ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

/**
 * Automated Prisma → Sanity content synchronization cron job.
 *
 * @access restricted - requires Bearer token authentication
 * @param request - Incoming request with Authorization header (Bearer CRON_SECRET)
 * @returns 200 `{ success: true, synced: { products, services }, summary, timestamp }` on successful sync
 * @returns 401 `{ error: "Unauthorized" }` when Bearer token is missing or invalid
 * @returns 500 `{ error: "Server misconfiguration" }` when CRON_SECRET is not configured
 * @returns 500 `{ success: false, error: "Internal server error", timestamp }` when sync fails
 * @see vercel.json — cron schedule configuration (default: daily at 2 AM)
 * @see lib/sync/prisma-to-sanity.ts — syncAllProducts, syncAllServices implementation
 * @see CLAUDE.md "Prisma ↔ Sanity Sync System" — field ownership rules and one-way sync architecture
 * @remarks Syncs both products and services from Prisma to Sanity in a single job.
 *   Authorization uses constant-time comparison to prevent timing attacks.
 *   Sync failures are logged but do not halt the entire job.
 */
export async function GET(request: NextRequest) {
  // Verify authorization (Vercel Cron sends a specific header).
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Fail closed: a missing secret is a misconfiguration, not an open door.
  if (!cronSecret) {
    logger.error("CRON_SECRET not configured — refusing cron sync", null);
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 },
    );
  }

  if (!bearerMatches(authHeader, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("Cron sync triggered", {
    timestamp: new Date().toISOString(),
  });

  try {
    // Sync both products and services
    const productResult = await syncAllProducts();
    const serviceResult = await syncAllServices();

    logger.info("Products sync completed", {
      total: productResult.total,
      successful: productResult.successful,
      failed: productResult.failed,
    });

    logger.info("Services sync completed", {
      total: serviceResult.total,
      successful: serviceResult.successful,
      failed: serviceResult.failed,
    });

    // Calculate totals across all synced entities
    const totalSynced = productResult.successful + serviceResult.successful;
    const totalFailed = productResult.failed + serviceResult.failed;

    logger.info("Cron sync completed", {
      totalSynced,
      totalFailed,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      synced: {
        products: productResult,
        services: serviceResult,
      },
      summary: {
        total: totalSynced + totalFailed,
        successful: totalSynced,
        failed: totalFailed,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Cron sync failed", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
