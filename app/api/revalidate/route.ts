import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const revalidateSchema = z.object({
  secret: z.string(),
  type: z.enum(["products", "services", "faq", "gallery", "testimonials", "site-settings"]),
});

/**
 * POST /api/revalidate
 * Next.js ISR (Incremental Static Regeneration) revalidation webhook
 *
 * Integrates with Sanity CMS to trigger cache invalidation when content is updated.
 * Validates a secret token (REVALIDATE_SECRET) to prevent unauthorized revalidation.
 * Revalidates cache tags based on content type using Next.js revalidateTag.
 *
 * Request body:
 * - secret: string (matches REVALIDATE_SECRET env var)
 * - type: "products" | "services" | "faq" | "gallery" | "testimonials" | "site-settings"
 *
 * Returns:
 * - 200: { success: true, revalidated: true, type: string, now: number }
 * - 400: Invalid request data or malformed JSON
 * - 401: Invalid secret token
 * - 500: Server misconfiguration (REVALIDATE_SECRET not set)
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
    const data = revalidateSchema.parse(body);

    // Verify secret token
    const revalidateSecret = process.env.REVALIDATE_SECRET;
    if (!revalidateSecret) {
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }
    if (data.secret !== revalidateSecret) {
      return NextResponse.json(
        { error: "Invalid secret token" },
        { status: 401 }
      );
    }

    // Revalidate the cache tag for the specified content type
    revalidateTag(data.type);

    return NextResponse.json({
      success: true,
      revalidated: true,
      type: data.type,
      now: Date.now(),
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
