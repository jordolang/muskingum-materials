import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

/**
 * Newsletter unsubscribe endpoint.
 *
 * @access public
 * @param request - Incoming request with body validated against `newsletterSchema`
 *   (email, name?). See lib/schemas.ts for shared schema conventions.
 * @returns 200 `{ success: true }` when subscriber is successfully deactivated
 * @returns 404 `{ error: "Email not found in subscriber list" }` when email is not subscribed
 * @returns 400 `{ error: "Invalid email" }` when validation fails
 * @throws 500 `{ error: "Failed to unsubscribe from newsletter" }` on database errors
 * @throws 500 `{ error: "Internal server error" }` on unexpected errors
 * @see rateLimitedEndpoints in middleware.ts — leads-newsletter tier (20 req/hour per IP)
 * @see RATE_LIMIT_TIERS in lib/rate-limit.ts for tier configuration
 * @remarks Sets `active: false` on the NewsletterSubscriber record rather than deleting it,
 *   preserving subscription history for audit purposes.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = newsletterSchema.parse(body);

    try {
      const subscriber = await prisma.newsletterSubscriber.findUnique({
        where: { email: data.email },
      });

      if (!subscriber) {
        return NextResponse.json(
          { error: "Email not found in subscriber list" },
          { status: 404 }
        );
      }

      await prisma.newsletterSubscriber.update({
        where: { email: data.email },
        data: { active: false },
      });
    } catch (error) {
      logger.error("Newsletter unsubscribe error", error);
      return NextResponse.json(
        { error: "Failed to unsubscribe from newsletter" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }
    logger.error("Newsletter unsubscribe API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
