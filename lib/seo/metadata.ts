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
    title: "Sand, Soil & Gravel - Zanesville, OH",
    description:
      "Southeast Ohio's resource for sand, soil, and gravel. Family-owned in Zanesville, OH. Fair pricing, delivery available, state-approved scales. Call (740) 319-0183.",
    keywords: [
      "gravel",
      "sand",
      "soil",
      "aggregate",
      "Zanesville",
      "Ohio",
      "delivery",
      "landscaping",
      "construction materials",
      "Muskingum Materials",
      "gravel delivery Zanesville Ohio",
      "sand near me",
      "topsoil Zanesville",
    ],
    canonical: "/",
  });
}

/**
 * Generate products page metadata
 */
export function generateProductsMetadata(): Metadata {
  return generateMetadata({
    title: "Sand, Gravel & Soil Products",
    description:
      "Browse our selection of quality sand, gravel, soil, and stone products. Competitive pricing, volume discounts, delivery available. State-approved scales for accurate measurements.",
    keywords: [
      "gravel products",
      "sand products",
      "topsoil",
      "fill dirt",
      "crushed stone",
      "limestone",
      "construction materials",
      "landscaping materials",
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
    title: "Material Delivery & Services",
    description:
      "Material sales, delivery services, large project pricing, and on-site loading. Serving Southeast Ohio with up to 20 tons per load. Call for delivery rates.",
    keywords: [
      "gravel delivery",
      "sand delivery",
      "material delivery Zanesville",
      "bulk materials",
      "contractor pricing",
      "volume discounts",
      "Southeast Ohio",
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
      "Get answers to common questions about our products, pricing, delivery, payment methods, and more. Learn about gravel, sand, and soil for your project.",
    keywords: [
      "gravel FAQ",
      "sand questions",
      "material delivery questions",
      "pricing information",
      "how to order gravel",
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
    title: "Contact Us - Get a Quote",
    description:
      "Contact Muskingum Materials for quotes, delivery rates, or questions. Located at 1133 Ellis Dam Rd, Zanesville, OH. Call (740) 319-0183 or email us.",
    keywords: [
      "contact Muskingum Materials",
      "get quote Zanesville",
      "gravel delivery quote",
      "material pricing",
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
    title: "About Us - Family-Owned Since Day One",
    description:
      "Learn about Muskingum Materials, a family-owned company serving Southeast Ohio with quality sand, gravel, and soil products. Fair pricing and honest service.",
    keywords: [
      "about Muskingum Materials",
      "family-owned business Zanesville",
      "local materials company",
      "Southeast Ohio gravel",
    ],
    canonical: "/about",
  });
}

/**
 * Generate gallery page metadata
 */
export function generateGalleryMetadata(): Metadata {
  return generateMetadata({
    title: "Project Gallery",
    description:
      "View photos of our products, equipment, and completed projects. See the quality of our sand, gravel, and soil materials in action.",
    keywords: [
      "material photos",
      "gravel images",
      "sand samples",
      "project gallery",
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
    title: "Material Calculators - Estimate Your Needs",
    description:
      "Calculate how much gravel, sand, or soil you need for your project. Free online calculators for accurate material estimates and pricing.",
    keywords: [
      "gravel calculator",
      "sand calculator",
      "material calculator",
      "how much gravel do I need",
      "project estimator",
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
