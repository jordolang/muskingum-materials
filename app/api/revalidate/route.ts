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
  ]),
  slug: z.string().optional(),
});

/**
 * Maps a content type (and optional slug) to the Next.js route path(s) that
 * actually render that content in `app/`.
 *
 * Only routes that exist in the built app are returned. `src/` is excluded from
 * the build (see tsconfig.json), so document types whose only reader lives there
 * (e.g. the `post`/`page` reader at `src/app/[slug]`) are intentionally not
 * supported — revalidating a non-existent route would purge nothing while
 * reporting success.
 */
function getPathsForContent(tag: string, slug?: string): string[] {
  switch (tag) {
    case "product":
      // Detail route: app/catalog/[slug]; listings: app/catalog, app/products.
      return slug
        ? [`/catalog/${slug}`, "/catalog", "/products"]
        : ["/catalog", "/products"];
    case "service":
      // No detail route exists (only app/services/page.tsx) — revalidate the listing.
      return ["/services"];
    // Content types rendered only via cache tags on list pages.
    case "testimonials":
    case "faq":
    case "gallery":
    case "site-settings":
      return [];
    default:
      return [];
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
 * - tag: "product" | "service" | "testimonials" | "faq" | "gallery" | "site-settings"
 * - slug?: string (optional, triggers path-based revalidation for individual content pages)
 *
 * Revalidation behaviour:
 * - Always calls revalidateTag(tag) to invalidate tag-backed list pages.
 * - Additionally calls revalidatePath() for every route that actually renders the
 *   content in `app/` (detail page when a slug is supplied, plus listing pages).
 *   Routes that only exist under the build-excluded `src/` tree are not mapped.
 *
 * Returns:
 * - 200: { success: true, revalidated: true, tag: string, paths?: string[], now: number }
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

    // Always revalidate the cache tag for tag-backed list pages
    revalidateTag(data.tag);

    // Also revalidate every route in `app/` that actually renders this content
    const paths = getPathsForContent(data.tag, data.slug);
    for (const path of paths) {
      revalidatePath(path);
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      tag: data.tag,
      ...(paths.length > 0 && { paths }),
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
