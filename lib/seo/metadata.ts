/**
 * Metadata utility library for SEO optimization.
 * Generates consistent meta tags, Open Graph, Twitter Cards, and canonical URLs.
 */

import type { Metadata } from "next";
import { BUSINESS_INFO } from "@/data/business";

/**
 * Base URL for the site (production)
 */
const BASE_URL = BUSINESS_INFO.website;

/**
 * Default OG image for pages without custom images
 */
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

/**
 * Options for generating page metadata
 */
export interface MetadataOptions {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
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
    description,
    keywords = [],
    canonical,
    ogImage = DEFAULT_OG_IMAGE,
    ogType = "website",
    noIndex = false,
  } = options;

  const fullTitle = `${title} | Muskingum Materials`;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;

  return {
    title: fullTitle,
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
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: BUSINESS_INFO.name,
      locale: "en_US",
      type: ogType,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

/**
 * Generate homepage metadata
 */
export function generateHomeMetadata(): Metadata {
  return generateMetadata({
    title: "State Approved Sand, Gravel & Aggregate Supplier - Zanesville, OH",
    description:
      "Muskingum Materials supplies state approved sand, gravel, and aggregate to contractors, municipalities, and commercial customers throughout Central and Southeastern Ohio. ODOT approved materials, state-approved scales, up to 20 tons per load. Call (740) 319-0183.",
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
      "Sand, gravel, state approved aggregate, oversized aggregate, and crushed concrete. Weighed on state-approved scales. Call for pricing and availability.",
    keywords: [
      "sand supplier",
      "gravel supplier",
      "aggregate supplier",
      "state approved aggregate",
      "ODOT aggregate",
      "oversized aggregate",
      "crushed concrete",
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
      "Material supply, delivery, and on-site loading for contractors, municipalities, and commercial projects. Serving Central and Southeastern Ohio with up to 20 tons per load.",
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
    title: "About Muskingum Materials",
    description:
      "Muskingum Materials is an established aggregate supplier in Zanesville, Ohio, providing state approved sand, gravel, and aggregate throughout Central and Southeastern Ohio.",
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
