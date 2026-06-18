import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  syncAllProducts,
  syncAllServices,
} from "@/lib/sync/prisma-to-sanity";

const syncSchema = z.object({
  secret: z.string(),
  type: z.enum(["products", "services"]),
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
 *
 * Returns:
 * - 200: { success: true, type: string, total: number, successful: number, failed: number, errors: [...] }
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

    const data = syncSchema.parse(body);

    // Verify secret token
    const syncSecret = process.env.SANITY_REVALIDATE_SECRET;
    if (!syncSecret) {
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }
    if (data.secret !== syncSecret) {
      return NextResponse.json(
        { error: "Invalid secret token" },
        { status: 401 }
      );
    }

    // Execute the appropriate sync operation
    logger.info("Manual sync triggered", {
      type: data.type,
    });

    let result;
    if (data.type === "products") {
      result = await syncAllProducts();
    } else {
      result = await syncAllServices();
    }

    // Return detailed sync results
    const response = {
      success: true,
      type: data.type,
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      errors: result.errors,
      timestamp: Date.now(),
    };

    logger.info("Manual sync completed", {
      type: data.type,
      total: result.total,
      successful: result.successful,
      failed: result.failed,
    });

    return NextResponse.json(response);
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

    logger.error("Manual sync failed", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
