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
 * GET /api/cron/sync
 * Cron job endpoint that triggers automated Prisma → Sanity content synchronization
 * Runs on a schedule defined in vercel.json (default: daily at 2 AM)
 * Requires authorization via Bearer token (CRON_SECRET environment variable)
 * Syncs both products and services from Prisma to Sanity
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
