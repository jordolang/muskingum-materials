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

export const sanityClient = safeCreateClient({
  ...sanityConfig,
  stega: { studioUrl: "/studio" },
});

export const previewClient = safeCreateClient({
  ...sanityConfig,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});
