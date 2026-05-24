/**
 * Sanity CMS configuration with validation and fallback behavior
 *
 * Sanity's createClient validates projectId and dataset at construction time
 * using strict regexes. If the env var is unset OR contains invalid characters
 * (which can happen during `next build` page-data collection on Vercel when
 * the value is missing/misconfigured), fall back to syntactically valid
 * placeholders so module load doesn't throw. Runtime queries will still fail
 * visibly if the real values are wrong.
 *
 * Validation rules (from @sanity/client):
 * - projectId: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ (lowercase alphanumeric with dashes)
 * - dataset: /^(~[a-z0-9]{1}[-_a-z0-9]{0,63}|[a-z0-9]{1}[-_a-z0-9]{0,63})$/
 */

/**
 * Raw project ID from environment variable, trimmed of whitespace
 */
const rawProjectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "").trim();

/**
 * Validates project ID against Sanity's required format
 * Must be lowercase alphanumeric with optional dashes between segments
 */
const isValidProjectId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawProjectId);

/**
 * Raw dataset name from environment variable, trimmed of whitespace
 */
const rawDataset = (process.env.NEXT_PUBLIC_SANITY_DATASET ?? "").trim();

/**
 * Validates dataset name against Sanity's required format
 * Supports both user datasets (~prefix) and standard datasets
 */
const isValidDataset =
  /^(~[a-z0-9][-_a-z0-9]{0,63}|[a-z0-9][-_a-z0-9]{0,63})$/.test(rawDataset);

/**
 * Sanity client configuration with validated credentials
 *
 * Falls back to placeholder values if environment variables are missing or invalid:
 * - projectId: Falls back to "placeholder" if NEXT_PUBLIC_SANITY_PROJECT_ID is invalid
 * - dataset: Falls back to "production" if NEXT_PUBLIC_SANITY_DATASET is invalid
 *
 * This prevents module load errors during build time while ensuring runtime
 * queries fail visibly if credentials are misconfigured.
 * @example
 * ```ts
 * import { sanityConfig } from "@/lib/sanity/config";
 *
 * console.log(sanityConfig.projectId); // "your-project-id"
 * console.log(sanityConfig.dataset);   // "production"
 * console.log(sanityConfig.useCdn);    // true in production, false in dev
 * ```
 */
export const sanityConfig = {
  projectId: isValidProjectId ? rawProjectId : "placeholder",
  dataset: isValidDataset ? rawDataset : "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
};
