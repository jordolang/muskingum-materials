/**
 * Canonical origin for the live site — the single source of truth for every
 * absolute URL the app emits (metadataBase, canonical links, og:url, the OG
 * image, sitemap, robots, structured data, and outbound links in emails).
 *
 * The app is currently served from its Vercel URL. The `muskingummaterials.com`
 * domain still points at the old WordPress site, so emitting it here makes
 * scrapers fetch OG images / canonicals from a dead host (HTTP 500).
 *
 * Cutover: when `muskingummaterials.com` is attached to this Vercel project,
 * set `NEXT_PUBLIC_SITE_URL=https://muskingummaterials.com` in the environment
 * (or change `DEFAULT_SITE_URL` below) — nothing else needs to change.
 */
const DEFAULT_SITE_URL = "https://muskingum-materials.vercel.app";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
).replace(/\/+$/, "");
