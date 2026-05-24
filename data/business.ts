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

export const PRODUCTS = [
  {
    name: "Bank Run",
    price: 13.0,
    unit: "ton",
    category: "gravel",
    description: "Natural unprocessed mix of sand, gravel, and small stones. Economical fill and base material.",
  },
  {
    name: "Fill Dirt",
    price: 7.0,
    unit: "ton",
    category: "soil",
    description: "Clean fill dirt for grading, backfill, and landscaping projects.",
  },
  {
    name: "Fill Sand (Washed)",
    price: 4.0,
    unit: "ton",
    category: "sand",
    description: "Washed fill sand for construction, backfill, and bedding applications.",
  },
  {
    name: "Topsoil (Unprocessed)",
    price: 10.0,
    unit: "ton",
    category: "soil",
    description: "Natural unprocessed topsoil for landscaping, gardening, and lawn establishment.",
  },
  {
    name: "#4 Fractured Gravel (Washed)",
    price: 28.0,
    unit: "ton",
    category: "gravel",
    description: "Large washed fractured gravel, roughly 1.5\" to 2.5\". Great for drainage and heavy base layers.",
  },
  {
    name: "#9 Gravel (Washed)",
    price: 9.0,
    unit: "ton",
    category: "gravel",
    description: "Fine washed gravel ideal for pipe bedding and drainage applications.",
  },
  {
    name: "#8 Gravel (Washed)",
    price: 15.0,
    unit: "ton",
    category: "gravel",
    description: "Washed 3/8\" gravel for walkways, paver bases, and driveway top dressing.",
  },
  {
    name: "#57 Gravel (Washed)",
    price: 19.5,
    unit: "ton",
    category: "gravel",
    description: "Washed 3/4\" to 1\" gravel. Versatile for driveways, drainage, and landscaping.",
  },
  {
    name: "#304 Crushed Gravel",
    price: 20.0,
    unit: "ton",
    category: "gravel",
    description: "Crushed limestone aggregate that compacts solid. Ideal driveway and base material.",
  },
  {
    name: "Oversized Gravel (Washed)",
    price: 28.0,
    unit: "ton",
    category: "gravel",
    description: "Large washed gravel for heavy drainage, erosion control, and decorative use.",
  },
  {
    name: "#57 Limestone",
    price: 38.0,
    unit: "ton",
    category: "stone",
    description: "Premium washed 3/4\" to 1\" limestone aggregate. Bright color for driveways and landscaping.",
  },
] as const satisfies readonly Product[];

export const PRODUCT_IMAGES: Partial<Record<(typeof PRODUCTS)[number]["name"], string>> = {
  "Bank Run": "/images/products/bank-run.jpg",
  "Fill Dirt": "/images/products/fill-dirt.jpg",
  "Fill Sand (Washed)": "/images/products/fill-sand.jpg",
  "Topsoil (Unprocessed)": "/images/products/topsoil.jpg",
  "#4 Fractured Gravel (Washed)": "/images/products/fractured-gravel.jpg",
  "#9 Gravel (Washed)": "/images/products/fine-gravel.jpg",
  "#8 Gravel (Washed)": "/images/photos/stone-close-up.jpg",
  "#57 Gravel (Washed)": "/images/photos/piles-close-up.jpg",
  "#304 Crushed Gravel": "/images/photos/piles-7.jpg",
  "Oversized Gravel (Washed)": "/images/photos/stone-hand.jpg",
  "#57 Limestone": "/images/photos/boulders.jpg",
};

export const SERVICES = [
  {
    title: "Material Sales",
    description:
      "Wide selection of sand, gravel, soil, and stone products at competitive prices. On-site state-approved scales ensure accurate measurements.",
    icon: "mountain",
    features: [
      "15+ product varieties",
      "State-approved scales",
      "Competitive pricing",
      "Volume discounts available",
    ],
  },
  {
    title: "Delivery Services",
    description:
      "We deliver materials directly to your job site with our fleet of trucks, handling loads up to 20 tons per trip.",
    icon: "truck",
    features: [
      "Up to 20 tons per load",
      "Serving Southeast Ohio",
      "Timely delivery",
      "Call for delivery rates",
    ],
  },
  {
    title: "Large Project Pricing",
    description:
      "Special pricing for large-quantity orders. Whether you're a contractor or homeowner with a big project, we offer volume discounts.",
    icon: "calculator",
    features: [
      "Volume discounts",
      "Contractor pricing",
      "Project consultation",
      "Custom orders",
    ],
  },
  {
    title: "On-Site Loading",
    description:
      "State of the art equipment for fast, efficient loading. Drive in, get loaded, and get back to your project quickly.",
    icon: "loader",
    features: [
      "Fast loading times",
      "Modern equipment",
      "Accurate weights",
      "Easy access",
    ],
  },
] as const;
