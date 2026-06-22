import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { captureError, addBreadcrumb } from "@/lib/monitoring";
import {
  reconcileProducts,
  reconcileServices,
} from "@/lib/sync/reconcile";

const reconcileSchema = z.object({
  secret: z.string(),
  type: z.enum(["products", "services", "all"]).optional().default("all"),
});

/**
 * Prisma ↔ Sanity reconciliation endpoint.
 *
 * @access protected (requires SANITY_REVALIDATE_SECRET)
 * @param request - Incoming request with body validated against the local `reconcileSchema`
 *   (secret, type). This is a read-only comparison operation that never modifies data.
 * @returns 200 `{ success: true, type: string, results: {...}, summary: {...}, durationMs: number }`
 *   - results.products/services: `{ onlyInPrisma: string[], onlyInSanity: string[], inBoth: string[] }`
 *   - summary: count statistics for each category (onlyInPrisma, onlyInSanity, inBoth)
 * @returns 401 `{ error: "Invalid secret" }` when secret does not match SANITY_REVALIDATE_SECRET
 * @throws 400 `{ error: "Invalid request data", details: ZodError[] }` when validation fails
 * @throws 400 `{ error: "Malformed JSON in request body" }` when JSON parsing fails
 * @throws 500 `{ error: "Server misconfiguration" }` when SANITY_REVALIDATE_SECRET is not configured
 * @throws 500 `{ error: "Internal server error" }` when reconciliation operation fails
 * @see reconcileProducts in lib/sync/reconcile.ts — compares Product records across stores
 * @see reconcileServices in lib/sync/reconcile.ts — compares Service records across stores
 * @see reconcileSchema — validates secret (string) and type ("products" | "services" | "all", default: "all")
 * @remarks Identifies sync mismatches without modifying data. Use this before running sync
 *   to preview what changes would be made. Records "onlyInPrisma" need sync; records
 *   "onlyInSanity" are orphaned and may need manual cleanup.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  // Log incoming request
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  logger.info("Reconciliation API request received", {
    operationType: "api_reconcile",
    requestId,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
  });

  addBreadcrumb("Reconciliation API request received", "api", {
    requestId,
    ip,
  });

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.warn("Malformed JSON in reconciliation request", {
        operationType: "api_reconcile",
        requestId,
        ip,
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });

      return NextResponse.json(
        { error: "Malformed JSON in request body" },
        { status: 400 }
      );
    }

    const data = reconcileSchema.parse(body);

    logger.info("Reconciliation request parsed", {
      operationType: "api_reconcile",
      requestId,
      reconcileType: data.type,
    });

    // Verify secret token
    const reconcileSecret = process.env.SANITY_REVALIDATE_SECRET;
    if (!reconcileSecret) {
      logger.error("Reconciliation API misconfigured - no secret", new Error("SANITY_REVALIDATE_SECRET not configured"), {
        operationType: "api_reconcile",
        requestId,
      });

      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    if (data.secret !== reconcileSecret) {
      logger.warn("Reconciliation request with invalid secret", {
        operationType: "api_reconcile",
        requestId,
        ip,
        userAgent,
      });

      addBreadcrumb("Reconciliation authentication failed", "auth", {
        requestId,
        reason: "invalid_secret",
      });

      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 401 }
      );
    }

    logger.info("Reconciliation request authenticated", {
      operationType: "api_reconcile",
      requestId,
      reconcileType: data.type,
    });

    addBreadcrumb("Reconciliation request authenticated", "auth", {
      requestId,
      reconcileType: data.type,
    });

    // Perform reconciliation based on type
    const results: {
      products?: Awaited<ReturnType<typeof reconcileProducts>>;
      services?: Awaited<ReturnType<typeof reconcileServices>>;
    } = {};

    if (data.type === "products" || data.type === "all") {
      results.products = await reconcileProducts();
    }

    if (data.type === "services" || data.type === "all") {
      results.services = await reconcileServices();
    }

    const durationMs = Date.now() - startTime;

    // Compute summary statistics
    const summary = {
      products: results.products ? {
        onlyInPrisma: results.products.onlyInPrisma.length,
        onlyInSanity: results.products.onlyInSanity.length,
        inBoth: results.products.inBoth.length,
      } : undefined,
      services: results.services ? {
        onlyInPrisma: results.services.onlyInPrisma.length,
        onlyInSanity: results.services.onlyInSanity.length,
        inBoth: results.services.inBoth.length,
      } : undefined,
    };

    logger.info("Reconciliation completed", {
      operationType: "api_reconcile",
      requestId,
      reconcileType: data.type,
      summary,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      type: data.type,
      results,
      summary,
      durationMs,
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;

    // Handle validation errors
    if (error instanceof z.ZodError) {
      logger.warn("Invalid reconciliation request data", {
        operationType: "api_reconcile",
        requestId,
        errors: error.errors,
        durationMs,
      });

      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    // Handle unexpected errors
    logger.error("Reconciliation API error", error instanceof Error ? error : new Error(String(error)), {
      operationType: "api_reconcile",
      requestId,
      durationMs,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    captureError(error instanceof Error ? error : new Error(String(error)), {
      operationType: "api_reconcile",
      requestId,
      durationMs,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
