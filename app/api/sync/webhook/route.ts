import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  syncAllProducts,
  syncAllServices,
  type BulkSyncResult,
} from "@/lib/sync/prisma-to-sanity";

const webhookSchema = z.object({
  secret: z.string(),
  type: z.enum(["products", "services", "all"]).optional().default("all"),
});

/**
 * Webhook endpoint for automated Prisma → Sanity content synchronization.
 *
 * @access public
 * @param request - Incoming request with body validated against the local `webhookSchema`
 *   (secret, type). Designed to be triggered by external schedulers (Vercel Cron, database
 *   triggers) to keep Sanity CMS in sync with Prisma database changes.
 * @returns 200 `{ success: true, synced: { products?: BulkSyncResult, services?: BulkSyncResult }, summary: {...}, timestamp: number }`
 *   when sync completes successfully
 * @returns 400 `{ error: "Malformed JSON in request body" }` when request body is not valid JSON
 * @returns 401 `{ error: "Invalid secret token" }` when secret does not match SANITY_REVALIDATE_SECRET
 * @throws 400 `{ error: "Invalid request data", details: ZodError[] }` when validation fails
 * @throws 500 `{ error: "Server misconfiguration" }` when SANITY_REVALIDATE_SECRET is not configured
 * @throws 500 `{ error: "Internal server error" }` when sync operations fail
 * @see webhookSchema — validates secret (string) and type ("products" | "services" | "all", defaults to "all")
 * @see syncAllProducts in lib/sync/prisma-to-sanity — executes product synchronization
 * @see syncAllServices in lib/sync/prisma-to-sanity — executes service synchronization
 * @remarks Requires SANITY_REVALIDATE_SECRET environment variable for authentication.
 *   Sync operations log results but do not halt on individual entity failures.
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON in request body" },
        { status: 400 }
      );
    }

    const data = webhookSchema.parse(body);

    // Verify secret token
    const webhookSecret = process.env.SANITY_REVALIDATE_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }
    if (data.secret !== webhookSecret) {
      return NextResponse.json(
        { error: "Invalid secret token" },
        { status: 401 }
      );
    }

    logger.info("Webhook sync triggered", {
      type: data.type,
      timestamp: new Date().toISOString(),
    });

    // Execute sync based on type parameter
    const syncResults: {
      products?: BulkSyncResult;
      services?: BulkSyncResult;
    } = {};

    if (data.type === "products" || data.type === "all") {
      const productResult = await syncAllProducts();
      syncResults.products = productResult;
      logger.info("Products sync completed", {
        total: productResult.total,
        successful: productResult.successful,
        failed: productResult.failed,
      });
    }

    if (data.type === "services" || data.type === "all") {
      const serviceResult = await syncAllServices();
      syncResults.services = serviceResult;
      logger.info("Services sync completed", {
        total: serviceResult.total,
        successful: serviceResult.successful,
        failed: serviceResult.failed,
      });
    }

    // Calculate totals across all synced entities
    const totalSynced =
      (syncResults.products?.successful || 0) +
      (syncResults.services?.successful || 0);
    const totalFailed =
      (syncResults.products?.failed || 0) +
      (syncResults.services?.failed || 0);

    logger.info("Webhook sync completed", {
      type: data.type,
      totalSynced,
      totalFailed,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      synced: syncResults,
      summary: {
        total: totalSynced + totalFailed,
        successful: totalSynced,
        failed: totalFailed,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error("Webhook sync failed", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
