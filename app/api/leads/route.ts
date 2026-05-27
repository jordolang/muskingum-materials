import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { leadSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

/**
 * POST /api/leads
 *
 * Creates a new lead record from website interactions (chat, forms, etc.)
 *
 * @rate-limit 20 requests per hour (leads-newsletter tier)
 *
 * @request-body {leadSchema}
 * - name?: string - Lead's name (optional)
 * - email?: string - Lead's email address (optional, must be valid email)
 * - phone?: string - Lead's phone number (optional)
 * - source?: string - Lead source identifier (defaults to "chat")
 * - visitorId?: string - Anonymous visitor tracking ID (optional)
 *
 * At least one of name, email, or phone must be provided.
 *
 * @response 200 - Success
 * { success: true }
 *
 * @response 400 - Validation error or missing required fields
 * { error: string, details?: ZodError[] }
 *
 * @response 500 - Database or server error
 * { error: string }
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
