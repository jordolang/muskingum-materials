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
 * Next.js ISR on-demand revalidation webhook for Sanity CMS publish/unpublish events.
 *
 * @access public
 * @param request - Incoming webhook request validated against `revalidateSchema`
 *   (secret, tag, slug). Webhook signature verified via SANITY_REVALIDATE_SECRET.
 * @returns 200 `{ success: true, revalidated: true, tag: string, paths?: string[], now: number }` on success
 * @throws 400 `{ error: "Malformed JSON in request body" }` when JSON parsing fails
 * @throws 400 `{ error: "Invalid request data", details: ZodError[] }` when validation fails
 * @throws 401 `{ error: "Invalid secret token" }` when webhook secret doesn't match SANITY_REVALIDATE_SECRET
 * @throws 500 `{ error: "Server misconfiguration" }` when SANITY_REVALIDATE_SECRET env var is not set
 * @see getPathsForContent - Maps content types to Next.js routes in `app/` that render them
 * @see CLAUDE.md ISR caching section - Webhook setup and time-based revalidation fallback (3600s)
 * @remarks Dual cache invalidation strategy: always calls `revalidateTag(tag)` for tag-backed list pages,
 *   then calls `revalidatePath(path)` for every route in `app/` that actually renders the content
 *   (detail page when slug is supplied, plus listing pages like /catalog, /products, /services).
 *   Routes under build-excluded `src/` tree are intentionally not mapped — revalidating a non-existent
 *   route would purge nothing while reporting success. Time-based revalidation (3600s on Sanity pages)
 *   serves as fallback when webhook delivery fails or SANITY_REVALIDATE_SECRET is missing.
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
