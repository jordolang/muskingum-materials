// Fall back to a syntactically valid placeholder so module load (e.g. during
// `next build` page-data collection) does not throw when the env var is unset.
// Runtime queries will still fail visibly if the real projectId is missing.
export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
};
