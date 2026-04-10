// Sanity's createClient validates projectId at construction time and only
// accepts [a-z0-9-]. If the env var is unset OR contains invalid characters
// (which can happen during `next build` page-data collection on Vercel when
// the value is missing/misconfigured), fall back to a syntactically valid
// placeholder so module load doesn't throw. Runtime queries will still fail
// visibly if the real projectId is wrong.
const rawProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
const isValidProjectId = /^[a-z0-9-]+$/.test(rawProjectId);

const rawDataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "";
const isValidDataset = /^~?[a-z0-9_-]{1,64}$/.test(rawDataset);

export const sanityConfig = {
  projectId: isValidProjectId ? rawProjectId : "placeholder",
  dataset: isValidDataset ? rawDataset : "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
};
