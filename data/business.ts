// Static company-level info that lives outside the catalog.
//
// IMPORTANT: this file is *not* a product or service catalog. Products live in
// Postgres (see `prisma/schema.prisma` → `Product`) and services live in
// Postgres (`Service`). Read them with `getProducts`/`getServices` from
// `lib/products.ts`, or via Prisma directly. Do not re-introduce hardcoded
// product or service arrays here.

export const BUSINESS_INFO = {
  name: "Muskingum Materials",
  tagline: "Southeast Ohio's Resource for Sand, Soil, and Gravel",
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
    "Muskingum Materials is a family-owned company in Zanesville, Ohio providing fair pricing on sand, soil, and gravel products. We offer large-quantity pricing for large projects, on-site state-approved scales, state of the art equipment, and trucking up to 20 tons per load.",
  features: [
    "Family-owned company",
    "Fair pricing",
    "Large-quantity pricing for large projects",
    "On-site scales (state approved)",
    "State of the Art equipment",
    "Trucking, up to 20 tons per load",
    "Delivery available",
  ],
  paymentMethods: ["Visa", "Mastercard", "Discover", "Apple Pay", "Cash", "Check"],
  taxRate: 0.0725,
  creditProcessingFee: 0.045,
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
