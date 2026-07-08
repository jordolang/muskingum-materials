interface Product {
  name: string;
  price: number;
  unit: string;
  category: string;
  description: string;
  pricingTiers?: Array<{
    minQuantity: number;
    maxQuantity?: number;
    pricePerTon: number;
  }>;
}

import { TAX_RATE, CREDIT_PROCESSING_FEE } from "@/lib/constants/business-rules";

export const BUSINESS_INFO = {
  name: "Muskingum Materials",
  tagline: "ODOT Approved Sand, Gravel & Aggregate Supplier",
  serviceArea: "Central and Southeastern Ohio",
  /**
   * ODOT qualification. `listingUrl` currently points at ODOT's certified
   * producers list; swap in the direct URL of the entry where Muskingum
   * Materials appears once available.
   */
  odot: {
    approved: true,
    label: "ODOT Approved Materials",
    listingUrl:
      "https://www.transportation.ohio.gov/working/construction/materials/approved/certified-producers",
  },
  address: "1133 Ellis Dam Rd",
  city: "Zanesville",
  state: "OH",
  zip: "43701",
  phone: "(740) 319-0183",
  altPhone: "(740) 453-3063",
  email: "sales@muskingummaterials.com",
  website: "https://muskingummaterials.com",
  hours: "Monday through Friday 7:30 AM – 4:00 PM",
  hoursParsed: {
    monday: "7:30 AM – 4:00 PM",
    tuesday: "7:30 AM – 4:00 PM",
    wednesday: "7:30 AM – 4:00 PM",
    thursday: "7:30 AM – 4:00 PM",
    friday: "7:30 AM – 4:00 PM",
    saturday: "Closed",
    sunday: "Closed",
  },
  description:
    "Muskingum Materials is an aggregate supplier in Zanesville, Ohio providing state approved sand, gravel, and aggregate to contractors, municipalities, and commercial customers throughout Central and Southeastern Ohio. On-site state-approved scales, ODOT approved materials, and trucking up to 20 tons per load.",
  features: [
    "State approved materials",
    "ODOT approved materials",
    "On-site scales (state approved)",
    "Trucking, up to 20 tons per load",
    "Semi-truck quantities",
    "Delivery available",
  ],
  paymentMethods: ["Visa", "Mastercard", "Discover", "Apple Pay", "Cash", "Check"],
  /**
   * Sales tax rate applied to all taxable purchases in Ohio.
   * Sourced from TAX_RATE in lib/constants/business-rules.ts.
   * Applied to the subtotal before credit card processing fees.
   */
  taxRate: TAX_RATE,
  /**
   * Credit card processing fee applied to credit/debit card transactions.
   * Sourced from CREDIT_PROCESSING_FEE in lib/constants/business-rules.ts.
   * Applied to the order total (subtotal + tax) when paying by card.
   * Does not apply to cash or check payments.
   */
  creditProcessingFee: CREDIT_PROCESSING_FEE,
  social: {
    facebook: "https://www.facebook.com/61584706747584/",
    facebookAlt: "https://www.facebook.com/61553200424830/",
    google: "https://www.google.com/maps/place/Muskingum+Materials/",
    googleMaps: "https://maps.app.goo.gl/muskingum-materials-zanesville",
  },
  googleMapsEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3072.5!2d-82.03!3d39.94!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMznCsDU2JzI0LjAiTiA4MsKwMDEnNDguMCJX!5e0!3m2!1sen!2sus!4v1",
  coordinates: {
    lat: 39.94,
    lng: -82.03,
  },
} as const;

// 2026 price list effective 07/01/2026
export const PRODUCTS = [
  {
    name: "Bank Run",
    price: 14.0,
    unit: "ton",
    category: "fill",
    description: "Natural unprocessed mix of sand, gravel, and small stones. Economical fill and base material.",
  },
  {
    name: "Fill Dirt",
    price: 8.0,
    unit: "ton",
    category: "fill",
    description: "Clean fill dirt for grading, backfill, and landscaping projects.",
  },
  {
    name: "Washed Fill Sand",
    price: 5.0,
    unit: "ton",
    category: "fill",
    description: "Washed fill sand for construction, backfill, and bedding applications.",
  },
  {
    name: "Asphalt Millings Unprocessed",
    price: 16.0,
    unit: "ton",
    category: "fill",
    description: "Recycled asphalt millings for driveways, parking lots, and road base. Binds with heat over time.",
  },
  {
    name: "Topsoil Unprocessed",
    price: 11.0,
    unit: "ton",
    category: "fill",
    description: "Natural unprocessed topsoil for landscaping, gardening, and lawn establishment.",
  },
  {
    name: "Washed #9 Gravel",
    price: 10.0,
    unit: "ton",
    category: "gravel",
    description: "Fine washed gravel ideal for pipe bedding and drainage applications.",
  },
  {
    name: "Washed #8 Gravel",
    price: 16.0,
    unit: "ton",
    category: "gravel",
    description: "Washed 3/8\" gravel for walkways, paver bases, and driveway top dressing.",
  },
  {
    name: "Washed #57 Gravel",
    price: 21.0,
    unit: "ton",
    category: "gravel",
    description: "Washed 3/4\" to 1\" gravel. Versatile for driveways, drainage, and landscaping.",
  },
  {
    name: "Crushed 304s Gravel",
    price: 21.0,
    unit: "ton",
    category: "gravel",
    description: "Dense-graded crushed gravel that compacts solid. Ideal driveway and road base material.",
  },
  {
    name: "Crushed #4 Gravel",
    price: 21.0,
    unit: "ton",
    category: "gravel",
    description: "Angular crushed #4 gravel, 1.5\" to 2.5\". Great for drainage and heavy base layers.",
  },
  {
    name: "Washed Oversized Gravel",
    price: 29.0,
    unit: "ton",
    category: "gravel",
    description: "Large washed gravel for heavy drainage, erosion control, and decorative use.",
  },
  {
    name: "#304 Limestone",
    price: 29.0,
    unit: "ton",
    category: "limestone",
    description: "Dense-graded crushed limestone for driveways, parking areas, and road base. Clean light-gray finish.",
  },
  {
    name: "#57 Limestone",
    price: 40.0,
    unit: "ton",
    category: "limestone",
    description: "Premium washed 3/4\" to 1\" limestone aggregate. Bright color for driveways and landscaping.",
  },
] as const satisfies readonly Product[];

// Each image is specific to the material's gradation, angularity, and color —
// see docs/material-image-research.md for the producer/spec references each
// photo was matched against.
export const PRODUCT_IMAGES: Partial<Record<(typeof PRODUCTS)[number]["name"], string>> = {
  "Bank Run": "/images/products/bank-run.jpg",
  "Fill Dirt": "/images/products/fill-dirt.jpg",
  "Washed Fill Sand": "/images/products/fill-sand-washed.jpg",
  "Asphalt Millings Unprocessed": "/images/products/asphalt-millings.jpg",
  "Topsoil Unprocessed": "/images/products/topsoil-unprocessed.jpg",
  "Washed #9 Gravel": "/images/products/9-gravel-washed.jpg",
  "Washed #8 Gravel": "/images/products/8-gravel-washed.jpg",
  "Washed #57 Gravel": "/images/products/57-gravel-washed.jpg",
  "Crushed 304s Gravel": "/images/products/304-crushed-gravel.jpg",
  "Crushed #4 Gravel": "/images/products/4-crushed-gravel.jpg",
  "Washed Oversized Gravel": "/images/products/oversized-gravel-washed.jpg",
  "#304 Limestone": "/images/products/304-limestone.jpg",
  "#57 Limestone": "/images/products/57-limestone.jpg",
};

export const SERVICES = [
  {
    title: "Material Supply",
    description:
      "Sand, gravel, and state approved aggregate, weighed on state-approved scales.",
    icon: "mountain",
    features: [
      "State approved materials",
      "ODOT approved",
      "Certified scale weights",
      "Semi-truck quantities",
    ],
  },
  {
    title: "Delivery",
    description:
      "Delivery to your job site, up to 20 tons per load.",
    icon: "truck",
    features: [
      "Up to 20 tons per load",
      "Serving Central and Southeastern Ohio",
      "Semi-truck quantities",
      "Call to schedule",
    ],
  },
  {
    title: "Commercial & Municipal Supply",
    description:
      "Supplying contractors, municipalities, and commercial projects across Central and Southeastern Ohio. Call to discuss your project.",
    icon: "calculator",
    features: [
      "Contractors",
      "Municipalities",
      "Commercial projects",
      "Free estimates",
    ],
  },
  {
    title: "On-Site Loading",
    description:
      "Drive in, get loaded, and get back to the job.",
    icon: "loader",
    features: [
      "Fast loading",
      "Certified scale weights",
      "Easy truck access",
      "Mon–Fri 7:30–4:00",
    ],
  },
] as const;
