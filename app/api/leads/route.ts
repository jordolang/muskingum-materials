import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { leadSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

/**
 * Lead capture endpoint for website interactions.
 *
 * @access public
 * @param request - Incoming request with body validated against `leadSchema`
 *   (name, email, phone, source, visitorId). At least one of name/email/phone required.
 * @returns 200 `{ success: true }` on successful lead creation
 * @returns 400 `{ error: string, details?: ZodError[] }` when validation fails or no contact fields provided
 * @returns 500 `{ error: string }` on database or server error
 * @see rateLimitedEndpoints in middleware.ts — leads-newsletter tier (20 req/hour per IP)
 * @see leadSchema in lib/schemas.ts for request body schema
 * @remarks Creates Lead record with source tracking. DB errors return 500 without exposing internals.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = leadSchema.parse(body);

    if (!data.email && !data.phone && !data.name) {
      return NextResponse.json(
        { error: "At least one contact field is required" },
        { status: 400 }
      );
    }

    try {
      await prisma.lead.create({
        data: {
          name: data.name || "Anonymous",
          email: data.email || "",
          phone: data.phone || null,
          source: data.source,
          message: data.visitorId ? `Chat visitor: ${data.visitorId}` : null,
        },
      });
    } catch (error) {
      logger.error("Lead creation error", error);
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Lead API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
