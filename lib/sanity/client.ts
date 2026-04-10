import { createClient, type SanityClient } from "next-sanity";
import { sanityConfig } from "./config";

// Defensive wrapper around createClient — if Sanity's internal validation
// rejects the resolved config (e.g. an env var slipped through with
// characters our regex didn't catch), fall back to a known-good placeholder
// config so the build's page-data collection step doesn't crash. Real
// runtime queries will still surface a meaningful error.
function safeCreateClient(
  config: Parameters<typeof createClient>[0]
): SanityClient {
  try {
    return createClient(config);
  } catch {
    return createClient({
      ...config,
      projectId: "placeholder",
      dataset: "production",
    });
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
