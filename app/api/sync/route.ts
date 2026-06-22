import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { captureError, addBreadcrumb } from "@/lib/monitoring";
import {
  syncAllProducts,
  syncAllServices,
} from "@/lib/sync/prisma-to-sanity";

const syncSchema = z.object({
  secret: z.string(),
  type: z.enum(["products", "services"]),
  dryRun: z.boolean().optional().default(false),
});

/**
 * POST /api/sync
 * Manual sync endpoint for Prisma → Sanity content synchronization
 *
 * Syncs products or services from Prisma database to Sanity CMS.
 * Requires admin authentication via secret token.
 *
 * Request body:
 * - secret: string (matches SANITY_REVALIDATE_SECRET env var)
 * - type: "products" | "services"
 * - dryRun: boolean (optional, default: false) - If true, validates sync without writing to Sanity
 *
 * Returns:
 * - 200: { success: true, type: string, total: number, successful: number, failed: number, errors: [...], dryRun?: boolean }
 * - 400: Invalid request data or malformed JSON
 * - 401: Invalid secret token
 * - 500: Server misconfiguration or sync failure
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  // Log incoming request
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  logger.info("Sync API request received", {
    operationType: "api_sync",
    requestId,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
  });

  addBreadcrumb("Sync API request received", "api", {
    requestId,
    ip,
  });

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.warn("Malformed JSON in sync request", {
        operationType: "api_sync",
        requestId,
        ip,
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });

      return NextResponse.json(
        { error: "Malformed JSON in request body" },
        { status: 400 }
      );
    }

    const data = syncSchema.parse(body);

    logger.info("Sync request parsed", {
      operationType: "api_sync",
      requestId,
      syncType: data.type,
      dryRun: data.dryRun,
    });

    // Verify secret token
    const syncSecret = process.env.SANITY_REVALIDATE_SECRET;
    if (!syncSecret) {
      logger.error("Sync API misconfigured - no secret", new Error("SANITY_REVALIDATE_SECRET not configured"), {
        operationType: "api_sync",
        requestId,
      });

      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    if (data.secret !== syncSecret) {
      logger.warn("Sync request with invalid secret", {
        operationType: "api_sync",
        requestId,
        ip,
        syncType: data.type,
        reason: "invalid_secret",
      });

      return NextResponse.json(
        { error: "Invalid secret token" },
        { status: 401 }
      );
    }

    logger.info("Sync request authenticated", {
      operationType: "api_sync",
      requestId,
      syncType: data.type,
      dryRun: data.dryRun,
    });

    addBreadcrumb("Sync request authenticated", "api", {
      requestId,
      syncType: data.type,
      dryRun: data.dryRun,
    });

    // Execute the appropriate sync operation
    logger.info("Manual sync triggered", {
      operationType: "api_sync",
      requestId,
      syncType: data.type,
      dryRun: data.dryRun,
      timestamp: new Date().toISOString(),
    });

    let result;
    if (data.type === "products") {
      result = await syncAllProducts(data.dryRun);
    } else {
      result = await syncAllServices(data.dryRun);
    }

    const duration = Date.now() - startTime;

    // Return detailed sync results
    const response = {
      success: true,
      type: data.type,
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      errors: result.errors,
      dryRun: data.dryRun,
      timestamp: Date.now(),
    };

    logger.info("Manual sync completed successfully", {
      operationType: "api_sync",
      requestId,
      syncType: data.type,
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      errorCount: result.errors.length,
      dryRun: data.dryRun,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });

    // If sync completed but had failures, capture as error for monitoring
    if (result.failed > 0) {
      captureError(
        new Error(`Sync completed with ${result.failed} failures out of ${result.total} items`),
        {
          operationType: "api_sync",
          requestId,
          syncType: data.type,
          total: result.total,
          successful: result.successful,
          failed: result.failed,
          errorCount: result.errors.length,
          durationMs: duration,
        }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof z.ZodError) {
      logger.warn("Invalid sync request data", {
        operationType: "api_sync",
        requestId,
        ip,
        validationErrors: error.errors,
      });

      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error("Manual sync failed", error, {
      operationType: "api_sync",
      requestId,
      ip,
      durationMs: duration,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    // Capture unexpected API errors in Sentry
    captureError(
      error instanceof Error ? error : new Error(String(error)),
      {
        operationType: "api_sync",
        requestId,
        ip,
        durationMs: duration,
      }
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
