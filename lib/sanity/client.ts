/**
 * Sanity CMS client configuration with graceful degradation
 * Provides two client instances: sanityClient for CDN-cached reads and previewClient for draft content
 */

import { createClient, type SanityClient } from "next-sanity";
import { sanityConfig } from "./config";

// In Vercel preview builds the Sanity env vars are often unset, so
// lib/sanity/config.ts falls back to `projectId: "placeholder"`. A real
// Sanity HTTP call against that config produces a "Dataset not found"
// error that crashes Next.js's build worker during SSG — even when the
// caller wraps the fetch in try/catch, because errors from within the
// patched global fetch can surface as unhandled rejections and exit the
// worker with code 1. Return a no-op stub client in that case so no
// HTTP call is made; `fetch()` resolves to `undefined`, which every
// existing caller treats as "fall back to static data".
//
// Production has real Sanity env vars and goes through the normal
// createClient path unchanged.
const usingPlaceholderConfig = sanityConfig.projectId === "placeholder";

/**
 * Creates a no-op stub client for graceful degradation when Sanity is not configured
 * @returns A proxy-based stub that prevents build crashes in preview environments
 */
function createStubClient(): SanityClient {
  // SanityClient has a wide surface; we only stub the methods the app
  // actually uses in server components. Everything else is a no-op that
  // resolves with `undefined`, which is the same shape the real client
  // returns when no data matches a query.
  const stub: Record<string, unknown> = {
    config: () => sanityConfig,
    fetch: () => Promise.resolve(undefined),
  };
  return new Proxy(stub, {
    get(target, prop) {
      if (prop in target) return target[prop as string];
      // Any other method returns a no-op async function so unexpected
      // call sites don't crash the build.
      return () => Promise.resolve(undefined);
    },
  }) as unknown as SanityClient;
}

/**
 * Safely creates a Sanity client with fallback to stub client on error
 * @param config - Sanity client configuration
 * @returns A configured Sanity client or stub client if configuration is invalid
 */
function safeCreateClient(
  config: Parameters<typeof createClient>[0],
): SanityClient {
  if (usingPlaceholderConfig) return createStubClient();
  try {
    return createClient(config);
  } catch {
    return createStubClient();
  }
}

/**
 * Standard Sanity client for production reads
 * - Uses CDN for fast, cached responses
 * - Includes stega encoding for visual editing in draft mode
 * - Use this for all public-facing content queries
 * @example
 * ```ts
 * import { sanityClient } from "@/lib/sanity/client";
 * import { productsQuery } from "@/lib/sanity/queries";
 *
 * // Fetch all products (CDN-cached)
 * const products = await sanityClient.fetch(productsQuery);
 * ```
 */
export const sanityClient = safeCreateClient({
  ...sanityConfig,
  stega: { studioUrl: "/studio" },
});

/**
 * Preview client for accessing draft content
 * - Bypasses CDN to fetch latest unpublished changes
 * - Requires SANITY_API_TOKEN for authenticated access
 * - Use this when displaying draft content or in preview mode
 */
export const previewClient = safeCreateClient({
  ...sanityConfig,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});
