/**
 * Sanity GROQ query definitions for fetching CMS content
 * All queries use the GROQ query language for Sanity.io
 */

import { groq } from "next-sanity";

/**
 * Fetches all products from Sanity CMS ordered by sortOrder
 *
 * **Return shape:**
 * - `_id`: Sanity document ID
 * - `name`: Product name
 * - `slug`: URL-friendly identifier
 * - `description`: Rich text product description
 * - `pricePerTon`: Base price per ton
 * - `pricingTiers`: Array of volume-based pricing tiers
 * - `unit`: Measurement unit (e.g., "ton", "yard")
 * - `category`: Product category classification
 * - `image`: Sanity image asset reference
 * - `featured`: Boolean indicating featured status
 * - `available`: Boolean indicating availability
 * - `sortOrder`: Display order (ascending)
 *
 * **Ordering:** Results are sorted by `sortOrder` ascending
 *
 * @example
 * ```ts
 * import { sanityClient } from "@/lib/sanity/client";
 * import { productsQuery } from "@/lib/sanity/queries";
 *
 * const products = await sanityClient.fetch(productsQuery);
 * ```
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
 *
 * **Parameters:**
 * - `slug`: The product slug (string) - pass as `{ slug: "gravel" }`
 *
 * **Return shape:**
 * - `_id`: Sanity document ID
 * - `name`: Product name
 * - `slug`: URL-friendly identifier (object with `current` property)
 * - `description`: Rich text product description
 * - `pricePerTon`: Base price per ton
 * - `unit`: Measurement unit (e.g., "ton", "yard")
 * - `category`: Product category classification
 * - `image`: Sanity image asset reference
 * - `featured`: Boolean indicating featured status
 * - `available`: Boolean indicating availability
 * - `specifications`: Detailed product specifications object
 *
 * **Note:** Returns the first matching product or `null` if not found
 *
 * @example
 * ```ts
 * import { sanityClient } from "@/lib/sanity/client";
 * import { productBySlugQuery } from "@/lib/sanity/queries";
 *
 * const product = await sanityClient.fetch(productBySlugQuery, { slug: "gravel" });
 * if (!product) {
 *   notFound(); // Next.js 404
 * }
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
 *
 * **Return shape:**
 * - `_id`: Sanity document ID
 * - `title`: Service name/title
 * - `slug`: URL-friendly identifier
 * - `description`: Rich text service description
 * - `icon`: Icon identifier or reference
 * - `image`: Sanity image asset reference
 * - `features`: Array of service feature strings
 * - `sortOrder`: Display order (ascending)
 *
 * **Ordering:** Results are sorted by `sortOrder` ascending
 *
 * @example
 * ```ts
 * import { sanityClient } from "@/lib/sanity/client";
 * import { servicesQuery } from "@/lib/sanity/queries";
 *
 * const services = await sanityClient.fetch(servicesQuery);
 * ```
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
 *
 * **Return shape:**
 * - `_id`: Sanity document ID
 * - `name`: Customer name
 * - `company`: Customer company/organization
 * - `rating`: Numeric rating (e.g., 1-5 stars)
 * - `text`: Testimonial content/quote
 * - `image`: Customer photo or logo (Sanity image asset reference)
 *
 * **Filtering:** Only returns testimonials where `approved == true`
 *
 * **Ordering:** Results are sorted by `_createdAt` descending (newest first)
 *
 * @example
 * ```ts
 * import { sanityClient } from "@/lib/sanity/client";
 * import { testimonialsQuery } from "@/lib/sanity/queries";
 *
 * const testimonials = await sanityClient.fetch(testimonialsQuery);
 * ```
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
 *
 * **Return shape:**
 * - `_id`: Sanity document ID
 * - `question`: The FAQ question text
 * - `answer`: Rich text answer content
 * - `category`: FAQ category for grouping (e.g., "Pricing", "Delivery")
 * - `sortOrder`: Display order (ascending)
 *
 * **Ordering:** Results are sorted by `sortOrder` ascending
 *
 * @example
 * ```ts
 * import { sanityClient } from "@/lib/sanity/client";
 * import { faqQuery } from "@/lib/sanity/queries";
 *
 * const faqs = await sanityClient.fetch(faqQuery);
 * // Group by category for display
 * const grouped = faqs.reduce((acc, faq) => {
 *   (acc[faq.category] = acc[faq.category] || []).push(faq);
 *   return acc;
 * }, {});
 * ```
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
 *
 * **Return shape:**
 * - `_id`: Sanity document ID
 * - `title`: Image/project title
 * - `image`: Sanity image asset reference
 * - `category`: Gallery category (e.g., "Commercial", "Residential")
 * - `description`: Rich text image description
 * - `sortOrder`: Display order (ascending)
 *
 * **Ordering:** Results are sorted by `sortOrder` ascending
 *
 * @example
 * ```ts
 * import { sanityClient } from "@/lib/sanity/client";
 * import { galleryQuery } from "@/lib/sanity/queries";
 *
 * const galleryImages = await sanityClient.fetch(galleryQuery);
 * ```
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
 *
 * **Return shape:**
 * - `title`: Site title
 * - `description`: Site meta description
 * - `logo`: Sanity image asset reference for site logo
 * - `phone`: Primary phone number
 * - `altPhone`: Alternative/secondary phone number
 * - `email`: Contact email address
 * - `address`: Street address
 * - `city`: City name
 * - `state`: State/province
 * - `zip`: Postal/ZIP code
 * - `hours`: Business hours text
 * - `googleMapsUrl`: Google Maps embed/link URL
 * - `facebook`: Facebook profile URL
 * - `instagram`: Instagram profile URL
 * - `twitter`: Twitter/X profile URL
 * - `tagline`: Site tagline/slogan
 * - `heroImage`: Hero section image (Sanity image asset reference)
 * - `heroVideo`: Hero section video URL
 *
 * **Note:** This is a singleton document - returns the first (and only) `siteSettings` document
 *
 * **Usage:** Used for site header, footer, contact information, and meta tags
 *
 * @example
 * ```ts
 * import { sanityClient } from "@/lib/sanity/client";
 * import { siteSettingsQuery } from "@/lib/sanity/queries";
 *
 * const settings = await sanityClient.fetch(siteSettingsQuery);
 * ```
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
 *
 * **Parameters:**
 * - `slug`: The page slug (string) - pass as `{ slug: "about" }`
 *
 * **Return shape:**
 * - `_id`: Sanity document ID
 * - `title`: Page title
 * - `slug`: URL-friendly identifier (object with `current` property)
 * - `content`: Rich text page content (portable text blocks)
 * - `seoTitle`: SEO-optimized title for meta tags
 * - `seoDescription`: SEO description for meta tags
 *
 * **Note:** Returns the first matching page or `null` if not found
 *
 * @example
 * ```ts
 * import { sanityClient } from "@/lib/sanity/client";
 * import { pageQuery } from "@/lib/sanity/queries";
 *
 * const page = await sanityClient.fetch(pageQuery, { slug: "about" });
 * if (!page) {
 *   notFound(); // Next.js 404
 * }
 * ```
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
