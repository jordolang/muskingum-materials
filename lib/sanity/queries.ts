/**
 * Sanity GROQ query definitions for fetching CMS content
 * All queries use the GROQ query language for Sanity.io
 */

import { groq } from "next-sanity";

/**
 * Fetches all products from Sanity CMS ordered by sortOrder
 * Returns product catalog with pricing, categories, and availability
 */
export const productsQuery = groq`
  *[_type == "product"] | order(sortOrder asc) {
    _id,
    name,
    slug,
    description,
    pricePerTon,
    pricingTiers,
    unit,
    category,
    image,
    featured,
    available,
    sortOrder
  }
`;

/**
 * Fetches a single product by its slug
 * Pass `{ slug: "gravel" }` as the params argument to `sanityClient.fetch`.
 * Returns detailed product information including specifications.
 * @example
 * ```ts
 * import { sanityClient } from "@/lib/sanity/client";
 * import { productBySlugQuery } from "@/lib/sanity/queries";
 *
 * const product = await sanityClient.fetch(productBySlugQuery, { slug: "gravel" });
 * ```
 */
export const productBySlugQuery = groq`
  *[_type == "product" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    description,
    pricePerTon,
    unit,
    category,
    image,
    featured,
    available,
    specifications
  }
`;

/**
 * Fetches all services from Sanity CMS ordered by sortOrder
 * Returns service listings with descriptions, icons, and features
 */
export const servicesQuery = groq`
  *[_type == "service"] | order(sortOrder asc) {
    _id,
    title,
    slug,
    description,
    icon,
    image,
    features,
    sortOrder
  }
`;

/**
 * Fetches approved testimonials ordered by creation date (newest first)
 * Only returns testimonials where approved is true
 * Returns customer feedback with ratings and company information
 */
export const testimonialsQuery = groq`
  *[_type == "testimonial" && approved == true] | order(_createdAt desc) {
    _id,
    name,
    company,
    rating,
    text,
    image
  }
`;

/**
 * Fetches all frequently asked questions ordered by sortOrder
 * Returns questions, answers, and category groupings
 */
export const faqQuery = groq`
  *[_type == "faq"] | order(sortOrder asc) {
    _id,
    question,
    answer,
    category,
    sortOrder
  }
`;

/**
 * Fetches all gallery images ordered by sortOrder
 * Returns project images with titles, categories, and descriptions
 */
export const galleryQuery = groq`
  *[_type == "galleryImage"] | order(sortOrder asc) {
    _id,
    title,
    image,
    category,
    description,
    sortOrder
  }
`;

/**
 * Fetches site-wide settings from Sanity CMS
 * Returns singleton configuration including contact info, branding, and social links
 * Used for site header, footer, and meta information
 */
export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    title,
    description,
    logo,
    phone,
    altPhone,
    email,
    address,
    city,
    state,
    zip,
    hours,
    googleMapsUrl,
    facebook,
    instagram,
    twitter,
    tagline,
    heroImage,
    heroVideo
  }
`;

/**
 * Fetches a single page by its slug
 * Pass `{ slug: "about" }` as the params argument to `sanityClient.fetch`.
 * Returns page content with SEO metadata for dynamic CMS pages.
 */
export const pageQuery = groq`
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    content,
    seoTitle,
    seoDescription
  }
`;
