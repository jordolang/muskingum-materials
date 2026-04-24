// Sanity's createClient validates projectId and dataset at construction time
// using strict regexes. If the env var is unset OR contains invalid characters
// (which can happen during `next build` page-data collection on Vercel when
// the value is missing/misconfigured), fall back to syntactically valid
// placeholders so module load doesn't throw. Runtime queries will still fail
// visibly if the real values are wrong.
//
// Sanity's actual rules (from @sanity/client):
//   projectId: /^[a-z0-9]+(?:-[a-z0-9]+)*$/  (lowercase alnum, dashes between)
//   dataset:   /^(~[a-z0-9]{1}[-_a-z0-9]{0,63}|[a-z0-9]{1}[-_a-z0-9]{0,63})$/
const rawProjectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "").trim();
const isValidProjectId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawProjectId);

const rawDataset = (process.env.NEXT_PUBLIC_SANITY_DATASET ?? "").trim();
const isValidDataset =
  /^(~[a-z0-9][-_a-z0-9]{0,63}|[a-z0-9][-_a-z0-9]{0,63})$/.test(rawDataset);

export const sanityConfig = {
  projectId: isValidProjectId ? rawProjectId : "placeholder",
  dataset: isValidDataset ? rawDataset : "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
};
