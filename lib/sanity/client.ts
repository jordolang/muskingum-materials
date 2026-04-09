import { createClient } from "next-sanity";
import { sanityConfig } from "./config";

export const sanityClient = createClient({
  ...sanityConfig,
  stega: { studioUrl: "/studio" },
});

export const previewClient = createClient({
  ...sanityConfig,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});
