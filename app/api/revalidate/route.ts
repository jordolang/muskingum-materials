import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { z } from "zod";

const revalidateSchema = z.object({
  secret: z.string(),
  tag: z.enum([
    "product",
    "service",
    "testimonials",
    "faq",
    "gallery",
    "site-settings",
    "page",
    "post",
  ]),
  slug: z.string().optional(),
});

/**
 * Maps content type and slug to the corresponding Next.js route path.
 * Returns undefined for content types that don't have individual pages.
 */
function getPathForContent(
  tag: string,
  slug: string
): string | undefined {
  switch (tag) {
    case "product":
      return `/catalog/${slug}`;
    case "service":
      return `/services/${slug}`;
    case "page":
      return `/${slug}`;
    case "post":
      return `/blog/${slug}`;
    // Content types without individual pages (list-only)
    case "testimonials":
    case "faq":
    case "gallery":
    case "site-settings":
      return undefined;
    default:
      return undefined;
  }
}

/**
 * POST /api/revalidate
 * Next.js ISR (Incremental Static Regeneration) revalidation webhook
 *
 * Integrates with Sanity CMS to trigger cache invalidation when content is updated.
 * Validates a secret token (REVALIDATE_SECRET) to prevent unauthorized revalidation.
 * Supports both tag-based revalidation (for lists) and path-based revalidation (for individual pages).
 *
 * Request body:
 * - secret: string (matches SANITY_REVALIDATE_SECRET env var)
 * - tag: "product" | "service" | "testimonials" | "faq" | "gallery" | "site-settings" | "page" | "post"
 * - slug?: string (optional, triggers path-based revalidation for individual content pages)
 *
 * When slug is provided:
 * - Calls revalidatePath() for the specific content page (/catalog/[slug], /blog/[slug], etc.)
 * - Also calls revalidateTag() to invalidate list pages
 *
 * When slug is omitted:
 * - Only calls revalidateTag() to invalidate list pages
 *
 * Returns:
 * - 200: { success: true, revalidated: true, tag: string, path?: string, now: number }
 * - 400: Invalid request data or malformed JSON
 * - 401: Invalid secret token
 * - 500: Server misconfiguration (SANITY_REVALIDATE_SECRET not set)
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
    const revalidateSecret = process.env.SANITY_REVALIDATE_SECRET;
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

    // Always revalidate the cache tag for list pages
    revalidateTag(data.tag);

    // If slug is provided, also revalidate the specific content page
    let revalidatedPath: string | undefined;
    if (data.slug) {
      const path = getPathForContent(data.tag, data.slug);
      if (path) {
        revalidatePath(path);
        revalidatedPath = path;
      }
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      tag: data.tag,
      ...(revalidatedPath && { path: revalidatedPath }),
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
