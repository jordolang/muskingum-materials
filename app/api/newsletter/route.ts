import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

/**
 * Newsletter subscription endpoint.
 *
 * @access public
 * @param request - Incoming request with body validated against `newsletterSchema`
 *   ({ email: string, name?: string }). See lib/schemas.ts for shared schema conventions.
 * @returns 200 `{ success: true }` with `X-RateLimit-*` headers on successful subscription or reactivation
 * @returns 429 `{ error: string, retryAfter: number }` when rate limit is exceeded
 * @throws 400 `{ error: "Invalid email" }` when Zod validation fails
 * @throws 500 `{ error: "Failed to subscribe to newsletter" }` on database errors
 * @see rateLimitedEndpoints in middleware.ts — leads-newsletter tier (20 req/hour per IP)
 * @see RATE_LIMIT_TIERS in lib/rate-limit.ts for tier configuration
 * @see newsletterSchema in lib/schemas.ts for request body validation schema
 * @remarks Upserts the subscriber — reactivates previously unsubscribed emails by setting
 *   `active: true`. Database failures during upsert return 500 but do not fail silently.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = newsletterSchema.parse(body);

    try {
      await prisma.newsletterSubscriber.upsert({
        where: { email: data.email },
        update: { active: true, name: data.name || undefined },
        create: {
          email: data.email,
          name: data.name || null,
        },
      });
    } catch (error) {
      logger.error("Newsletter subscription error", error);
      return NextResponse.json({ error: "Failed to subscribe to newsletter" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }
    logger.error("Newsletter API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
