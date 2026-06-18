import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  syncAllProducts,
  syncAllServices,
} from "@/lib/sync/prisma-to-sanity";

const webhookSchema = z.object({
  secret: z.string(),
  type: z.enum(["products", "services", "all"]).optional().default("all"),
});

/**
 * POST /api/sync/webhook
 * Webhook endpoint for automated Prisma → Sanity content synchronization
 *
 * Designed to be triggered by external schedulers (Vercel Cron, database triggers)
 * to keep Sanity CMS in sync with Prisma database changes.
 *
 * Request body:
 * - secret: string (matches SANITY_REVALIDATE_SECRET env var)
 * - type: "products" | "services" | "all" (optional, defaults to "all")
 *
 * Returns:
 * - 200: { success: true, synced: { products: {...}, services: {...} } }
 * - 400: Invalid request data or malformed JSON
 * - 401: Invalid secret token
 * - 500: Server misconfiguration or sync failure
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
      products?: {
        total: number;
        successful: number;
        failed: number;
        errors: Array<{ slug: string; error: string }>;
      };
      services?: {
        total: number;
        successful: number;
        failed: number;
        errors: Array<{ slug: string; error: string }>;
      };
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
