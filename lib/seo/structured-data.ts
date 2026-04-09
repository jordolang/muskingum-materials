/**
 * Structured Data (JSON-LD) utility library for SEO optimization.
 * Generates schema.org compliant structured data for LocalBusiness, Product, and FAQ pages.
 */

import { BUSINESS_INFO } from "@/data/business";

/**
 * Base JSON-LD schema with @context
 */
interface BaseSchema {
  "@context": string;
  "@type": string;
}

/**
 * LocalBusiness schema for homepage and contact page
 */
export interface LocalBusinessSchema extends BaseSchema {
  "@type": "LocalBusiness";
  name: string;
  description: string;
  url: string;
  telephone: string;
  email: string;
  address: {
    "@type": "PostalAddress";
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    "@type": "GeoCoordinates";
    latitude: number;
    longitude: number;
  };
  openingHoursSpecification?: Array<{
    "@type": "OpeningHoursSpecification";
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }>;
  paymentAccepted?: string[];
  priceRange?: string;
}

/**
 * Product schema for product pages
 */
export interface ProductSchema extends BaseSchema {
  "@type": "Product";
  name: string;
  description: string;
  offers: {
    "@type": "Offer";
    price: number | string;
    priceCurrency: string;
    availability: string;
    priceSpecification?: {
      "@type": "UnitPriceSpecification";
      price: number;
      priceCurrency: string;
      unitText: string;
    };
  };
}

/**
 * FAQ schema for FAQ pages
 */
export interface FAQPageSchema extends BaseSchema {
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

/**
 * Generate LocalBusiness structured data
 */
export function generateLocalBusinessSchema(): LocalBusinessSchema {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BUSINESS_INFO.name,
    description: BUSINESS_INFO.description,
    url: BUSINESS_INFO.website,
    telephone: BUSINESS_INFO.phone,
    email: BUSINESS_INFO.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS_INFO.address,
      addressLocality: BUSINESS_INFO.city,
      addressRegion: BUSINESS_INFO.state,
      postalCode: BUSINESS_INFO.zip,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS_INFO.coordinates.lat,
      longitude: BUSINESS_INFO.coordinates.lng,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "07:30",
        closes: "16:00",
      },
    ],
    paymentAccepted: [...BUSINESS_INFO.paymentMethods],
    priceRange: "$$",
  };
}

/**
 * Generate Product structured data
 */
export function generateProductSchema(product: {
  name: string;
  description: string;
  price: number;
  unit: string;
}): ProductSchema {
  const isCallForPrice = product.price === 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    offers: {
      "@type": "Offer",
      price: isCallForPrice ? "Call for pricing" : product.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      ...(isCallForPrice
        ? {}
        : {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: product.price,
              priceCurrency: "USD",
              unitText: product.unit,
            },
          }),
    },
  };
}

/**
 * Generate FAQPage structured data
 */
export function generateFAQPageSchema(faqs: Array<{ question: string; answer: string }>): FAQPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Convert structured data object to JSON-LD script tag string
 */
export function toJsonLd(schema: BaseSchema): string {
  return JSON.stringify(schema, null, 2);
}

/**
 * Generate all common structured data schemas for the site
 */
export const structuredData = {
  localBusiness: generateLocalBusinessSchema,
  product: generateProductSchema,
  faqPage: generateFAQPageSchema,
  toJsonLd,
} as const;
