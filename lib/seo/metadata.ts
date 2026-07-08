/**
 * Metadata utility library for SEO optimization.
 * Generates consistent meta tags, Open Graph, Twitter Cards, and canonical URLs.
 */

import type { Metadata } from "next";
import { BUSINESS_INFO } from "@/data/business";
import { SITE_URL } from "@/lib/site-url";

/**
 * Base URL for the site — the live origin (see `lib/site-url.ts`). Used to
 * build canonical URLs and og:url so scrapers resolve them against the host
 * that actually serves the app.
 */
const BASE_URL = SITE_URL;

/**
 * Options for generating page metadata
 */
export interface MetadataOptions {
  /**
   * Page title WITHOUT the brand — the root layout's title template appends
   * " | Muskingum Materials". Keep the full result under ~60 characters,
   * so the page part should stay under ~38.
   */
  title: string;
  /**
   * Use the title exactly as given, bypassing the layout's brand template.
   * For pages (like the homepage) that lead with the brand themselves.
   */
  absoluteTitle?: boolean;
  /** Keep under ~160 characters or Google truncates it in results. */
  description: string;
  /**
   * Shorter description for social cards (og:description / twitter:description).
   * Social previews truncate around 110–125 characters — well below the ~160
   * Google allows. When omitted, `description` is reused. Provide this whenever
   * `description` runs longer than ~125 characters.
   */
  ogDescription?: string;
  keywords?: string[];
  canonical?: string;
  /**
   * Explicit OG image override. When omitted, the route's
   * `opengraph-image.tsx` (file-based metadata) supplies the image.
   */
  ogImage?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
}

/**
 * Generate complete Next.js Metadata object for a page
 */
export function generateMetadata(options: MetadataOptions): Metadata {
  const {
    title,
    absoluteTitle = false,
    description,
    ogDescription = description,
    keywords = [],
    canonical,
    ogImage,
    ogType = "website",
    noIndex = false,
  } = options;

  // Branded variant for OG/Twitter cards, where the layout template doesn't
  // apply. The <title> itself gets branding from the layout's "%s | ..."
  // template instead — appending here too would double the brand.
  const brandedTitle = absoluteTitle
    ? title
    : `${title} | ${BUSINESS_INFO.name}`;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;
  const ogImages = ogImage
    ? [{ url: ogImage, width: 1200, height: 630, alt: title }]
    : undefined;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl,
        }
      : undefined,
    openGraph: {
      title: brandedTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName: BUSINESS_INFO.name,
      locale: "en_US",
      type: ogType,
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description: ogDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

/**
 * Generate homepage metadata
 */
export function generateHomeMetadata(): Metadata {
  return generateMetadata({
    title: "Muskingum Materials | ODOT Sand & Gravel, Zanesville OH",
    absoluteTitle: true,
    description:
      "ODOT approved sand, gravel, and aggregate for contractors, municipalities, and commercial projects across Central & Southeastern Ohio. Call (740) 319-0183.",
    ogDescription:
      "ODOT approved sand, gravel & aggregate for contractors and municipalities across Central & Southeastern Ohio.",
    // The homepage sets its own openGraph, which replaces the layout's — and it
    // has no route-level opengraph-image.tsx — so the social image must be named
    // here explicitly or the homepage ships no og:image at all.
    ogImage: "/images/og-image.png",
    keywords: [
      "sand supplier",
      "gravel supplier",
      "aggregate supplier",
      "state approved aggregate",
      "ODOT aggregate",
      "ODOT materials",
      "ODOT supplier",
      "Muskingum Materials",
      "Central Ohio aggregate",
      "Southeastern Ohio aggregate",
      "commercial aggregate supplier",
      "Zanesville Ohio",
    ],
    canonical: "/",
  });
}

/**
 * Generate products page metadata
 */
export function generateProductsMetadata(): Metadata {
  return generateMetadata({
    title: "Sand, Gravel & Aggregate Products",
    description:
      "Sand, gravel, limestone, and state approved aggregate. Weighed on state-approved scales. Call for pricing and availability.",
    keywords: [
      "sand supplier",
      "gravel supplier",
      "aggregate supplier",
      "state approved aggregate",
      "ODOT aggregate",
      "oversized aggregate",
      "crushed limestone",
      "Central Ohio aggregate",
      "Southeastern Ohio aggregate",
      "Zanesville Ohio",
    ],
    canonical: "/products",
  });
}

/**
 * Generate services page metadata
 */
export function generateServicesMetadata(): Metadata {
  return generateMetadata({
    title: "Material Supply & Delivery",
    description:
      "Material supply, delivery, and on-site loading for contractors and municipalities. Serving Central & Southeastern Ohio with up to 20 tons per load.",
    ogDescription:
      "Material supply, delivery & on-site loading for contractors and municipalities across Central & Southeastern Ohio.",
    keywords: [
      "aggregate delivery",
      "gravel delivery",
      "sand delivery",
      "commercial aggregate supplier",
      "ODOT supplier",
      "Central Ohio aggregate",
      "Southeastern Ohio aggregate",
    ],
    canonical: "/services",
  });
}

/**
 * Generate FAQ page metadata
 */
export function generateFAQMetadata(): Metadata {
  return generateMetadata({
    title: "Frequently Asked Questions",
    description:
      "Answers to common questions about materials, delivery, and hours at Muskingum Materials, serving Central and Southeastern Ohio.",
    ogDescription:
      "Common questions about materials, delivery & hours at Muskingum Materials, serving Central & Southeastern Ohio.",
    keywords: [
      "aggregate FAQ",
      "gravel FAQ",
      "sand questions",
      "material delivery questions",
      "Zanesville materials",
    ],
    canonical: "/faq",
  });
}

/**
 * Generate contact page metadata
 */
export function generateContactMetadata(): Metadata {
  return generateMetadata({
    title: "Contact Us - Free Estimates",
    description:
      "Call for material availability and free estimates. Located at 1133 Ellis Dam Rd, Zanesville, OH. Call (740) 319-0183 or email sales@muskingummaterials.com.",
    ogDescription:
      "Call (740) 319-0183 for material availability and free estimates. 1133 Ellis Dam Rd, Zanesville, OH.",
    keywords: [
      "contact Muskingum Materials",
      "aggregate supplier Zanesville",
      "free estimate aggregate",
      "material availability",
      "Zanesville materials contact",
    ],
    canonical: "/contact",
  });
}

/**
 * Generate about page metadata
 */
export function generateAboutMetadata(): Metadata {
  return generateMetadata({
    title: "About Us",
    description:
      "Muskingum Materials is an ODOT qualified aggregate supplier in Zanesville, Ohio, providing state approved sand and gravel across Central & Southeastern Ohio.",
    ogDescription:
      "ODOT-qualified aggregate supplier in Zanesville, OH — state approved sand & gravel for Central & Southeastern Ohio.",
    keywords: [
      "about Muskingum Materials",
      "aggregate supplier Zanesville",
      "Central Ohio aggregate",
      "Southeastern Ohio aggregate",
    ],
    canonical: "/about",
  });
}

/**
 * Generate gallery page metadata
 */
export function generateGalleryMetadata(): Metadata {
  return generateMetadata({
    title: "Gallery",
    description:
      "Photos of the Muskingum Materials yard, aggregate stockpiles, and operations in Zanesville, Ohio.",
    keywords: [
      "aggregate stockpiles",
      "material yard photos",
      "quarry photos",
      "Zanesville materials",
    ],
    canonical: "/gallery",
  });
}

/**
 * Generate calculators page metadata
 */
export function generateCalculatorsMetadata(): Metadata {
  return generateMetadata({
    title: "Material Quantity Calculators",
    description:
      "Calculate how many tons of sand, gravel, or aggregate your project needs. Call for pricing and availability.",
    keywords: [
      "gravel calculator",
      "sand calculator",
      "aggregate calculator",
      "how much gravel do I need",
      "tonnage calculator",
    ],
    canonical: "/calculators",
  });
}

/**
 * Prebuilt metadata generators for all pages
 */
export const pageMetadata = {
  home: generateHomeMetadata,
  products: generateProductsMetadata,
  services: generateServicesMetadata,
  faq: generateFAQMetadata,
  contact: generateContactMetadata,
  about: generateAboutMetadata,
  gallery: generateGalleryMetadata,
  calculators: generateCalculatorsMetadata,
  generate: generateMetadata,
} as const;
