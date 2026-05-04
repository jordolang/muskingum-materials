import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCTS_DATA = [
  {
    slug: "bank-run",
    name: "Bank Run",
    category: "gravel",
    description:
      "Natural unprocessed mix of sand, gravel, and small stones straight from the bank. An economical fill and base material that compacts well for grading, driveways, and large fill projects.",
    shortDescription:
      "Natural sand, gravel, and stone mix. Economical fill and base material.",
    price: 13.0,
    unit: "ton",
    marketPriceLowPerTon: 12,
    marketPriceHighPerTon: 20,
    marketPriceLowPerYard: 16,
    marketPriceHighPerYard: 28,
    sizeDescription: "Mixed natural sizes",
    colorDescription: "Tan to brown with mixed earth tones",
    densityLow: 1.4,
    densityHigh: 1.6,
    bestFor: ["Fill projects", "Base material", "Grading", "Driveway sub-base"],
    notFor: ["Decorative landscaping", "Finished surfaces"],
    commonUses: ["Fill", "Grading", "Backfill", "Driveway base", "Site prep"],
    pros: [
      "Very economical for large projects",
      "Compacts firmly",
      "Versatile fill material",
      "Locally sourced",
    ],
    cons: [
      "Inconsistent material composition",
      "Not decorative",
      "Contains fines and may be dusty",
    ],
    altNames: ["Bank gravel", "Pit run"],
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "fill-dirt",
    name: "Fill Dirt",
    category: "soil",
    description:
      "Clean fill dirt for grading, backfill, and landscaping projects. Compacts firmly and won't decompose, making it ideal structural fill where plant growth is not the goal.",
    shortDescription:
      "Clean fill dirt for grading, backfill, and landscaping.",
    price: 7.0,
    unit: "ton",
    marketPriceLowPerTon: 5,
    marketPriceHighPerTon: 15,
    marketPriceLowPerYard: 8,
    marketPriceHighPerYard: 25,
    sizeDescription: "Mineral subsoil",
    colorDescription: "Tan to brown",
    densityLow: 1.3,
    densityHigh: 1.5,
    bestFor: ["Grading", "Backfill", "Raising low spots", "Foundation prep"],
    notFor: ["Growing plants", "Lawn establishment"],
    commonUses: ["Grading", "Backfill", "Site fill", "Foundation prep"],
    pros: [
      "Very affordable",
      "Compacts firmly",
      "Doesn't decompose or settle over time",
      "Perfect for structural fill",
    ],
    cons: [
      "Won't support plant growth",
      "May contain rocks and roots",
      "Not for decorative use",
    ],
    altNames: [],
    featured: true,
    sortOrder: 2,
  },
  {
    slug: "fill-sand-washed",
    name: "Fill Sand (Washed)",
    category: "sand",
    description:
      "Quality washed fill sand for construction, backfill, and bedding applications. Cleaned of fines and organic matter so it drains well and compacts predictably.",
    shortDescription:
      "Washed fill sand for construction, backfill, and bedding.",
    price: 4.0,
    unit: "ton",
    marketPriceLowPerTon: 8,
    marketPriceHighPerTon: 25,
    marketPriceLowPerYard: 10,
    marketPriceHighPerYard: 35,
    sizeDescription: "Fine washed sand",
    colorDescription: "Tan",
    densityLow: 1.4,
    densityHigh: 1.6,
    bestFor: ["Backfill", "Pipe bedding", "Paver leveling base", "Construction fill"],
    notFor: ["Decorative landscaping", "Topsoil replacement"],
    commonUses: ["Backfill", "Pipe bedding", "Paver base", "Construction"],
    pros: [
      "Cleaned of fines and organics",
      "Excellent drainage",
      "Compacts predictably",
      "Versatile across construction uses",
    ],
    cons: [
      "Not for plant growth",
      "Can shift without containment",
    ],
    altNames: ["Washed sand"],
    featured: false,
    sortOrder: 3,
  },
  {
    slug: "topsoil-unprocessed",
    name: "Topsoil (Unprocessed)",
    category: "soil",
    description:
      "Natural unscreened topsoil for landscaping, gardening, and lawn establishment. Contains organic matter that supports plant growth.",
    shortDescription:
      "Natural unprocessed topsoil for landscaping and gardening.",
    price: 10.0,
    unit: "ton",
    marketPriceLowPerTon: 12,
    marketPriceHighPerTon: 30,
    marketPriceLowPerYard: 15,
    marketPriceHighPerYard: 40,
    sizeDescription: "Unscreened soil",
    colorDescription: "Dark brown",
    densityLow: 1.0,
    densityHigh: 1.3,
    bestFor: ["Lawn establishment", "Garden beds", "Raising low spots", "Landscaping"],
    notFor: ["Structural fill", "Driveways", "Compacted bases"],
    commonUses: ["Landscaping", "Gardening", "Lawn prep", "Raised beds"],
    pros: [
      "Affordable for large landscape projects",
      "Supports plant growth",
      "Local material",
    ],
    cons: [
      "Unscreened — may contain rocks, roots, or sticks",
      "Settles over time",
      "Quality varies by load",
    ],
    altNames: ["Unscreened topsoil"],
    featured: false,
    sortOrder: 4,
  },
  {
    slug: "4-fractured-gravel-washed",
    name: "#4 Fractured Gravel (Washed)",
    category: "gravel",
    description:
      "Washed fractured #4 gravel — large angular crushed stone roughly 1.5 to 2.5 inches. Excellent for drainage applications, heavy base layers, and erosion control where larger, free-draining stone is needed.",
    shortDescription:
      "Large washed fractured gravel, roughly 1.5\" to 2.5\". Drainage and heavy base.",
    price: 28.0,
    unit: "ton",
    marketPriceLowPerTon: 25,
    marketPriceHighPerTon: 45,
    marketPriceLowPerYard: 30,
    marketPriceHighPerYard: 60,
    sizeDescription: "1.5\" to 2.5\" angular fractured stone",
    colorDescription: "Gray to blue-gray",
    densityLow: 1.35,
    densityHigh: 1.5,
    bestFor: ["Drainage", "Heavy base layers", "Erosion control", "French drains"],
    notFor: ["Walking surfaces", "Driveway top dressing"],
    commonUses: ["Drainage", "Base layers", "Erosion control", "Pipe bedding"],
    pros: [
      "Excellent drainage characteristics",
      "Angular edges interlock for stability",
      "Durable and long-lasting",
    ],
    cons: [
      "Too coarse for walking",
      "Sharp edges",
      "Not decorative on its own",
    ],
    altNames: ["#4 stone", "Drain rock"],
    featured: false,
    sortOrder: 5,
  },
  {
    slug: "9-gravel-washed",
    name: "#9 Gravel (Washed)",
    category: "gravel",
    description:
      "Fine washed gravel ideal for pipe bedding, drainage layers, and filling tight voids. The small size allows it to flow into and around pipes for excellent contact and support.",
    shortDescription:
      "Fine washed gravel for pipe bedding and drainage.",
    price: 9.0,
    unit: "ton",
    marketPriceLowPerTon: 18,
    marketPriceHighPerTon: 35,
    marketPriceLowPerYard: 22,
    marketPriceHighPerYard: 45,
    sizeDescription: "Fine angular crushed stone",
    colorDescription: "Gray",
    densityLow: 1.35,
    densityHigh: 1.5,
    bestFor: ["Pipe bedding", "Drainage layers", "Under-drains", "Tight backfill"],
    notFor: ["Driveway surface", "Decorative landscaping"],
    commonUses: ["Pipe bedding", "Drainage", "Backfill", "Asphalt mix"],
    pros: [
      "Flows around pipes for full contact",
      "Excellent drainage",
      "Affordable per ton",
    ],
    cons: [
      "Too small for driveway base",
      "Can migrate without containment",
    ],
    altNames: [],
    featured: false,
    sortOrder: 6,
  },
  {
    slug: "8-gravel-washed",
    name: "#8 Gravel (Washed)",
    category: "gravel",
    description:
      "Washed 3/8 inch gravel — comfortable to walk on, compacts better than larger stone, and works as a finishing layer for driveways or as a clean base under pavers.",
    shortDescription:
      "Washed 3/8\" gravel for walkways, paver bases, and driveway top dressing.",
    price: 15.0,
    unit: "ton",
    marketPriceLowPerTon: 22,
    marketPriceHighPerTon: 40,
    marketPriceLowPerYard: 28,
    marketPriceHighPerYard: 50,
    sizeDescription: "3/8\" to 1/2\" angular crushed stone",
    colorDescription: "Gray to blue-gray",
    densityLow: 1.35,
    densityHigh: 1.5,
    bestFor: ["Walkways", "Paver base", "Between pavers", "Driveway top dressing"],
    notFor: ["Heavy-load driveway base", "Steep grades"],
    commonUses: ["Walkways", "Patios", "Top dressing", "Drainage backfill"],
    pros: [
      "Comfortable to walk on",
      "Compacts well",
      "Fills paver gaps cleanly",
      "Good drainage",
    ],
    cons: [
      "Migrates without edging",
      "Less stable than larger stone",
      "Can be tracked indoors",
    ],
    altNames: [],
    featured: false,
    sortOrder: 7,
  },
  {
    slug: "57-gravel-washed",
    name: "#57 Gravel (Washed)",
    category: "gravel",
    description:
      "One of the most versatile aggregates we sell — washed 3/4 to 1 inch crushed stone. Excellent for driveways, drainage, concrete mix, and pipe bedding.",
    shortDescription:
      "Washed 3/4\" to 1\" gravel. Versatile for driveways, drainage, and landscaping.",
    price: 19.5,
    unit: "ton",
    marketPriceLowPerTon: 20,
    marketPriceHighPerTon: 35,
    marketPriceLowPerYard: 25,
    marketPriceHighPerYard: 45,
    sizeDescription: "3/4\" to 1\" angular crushed stone",
    colorDescription: "Gray to blue-gray",
    densityLow: 1.35,
    densityHigh: 1.55,
    bestFor: ["Driveways (base layer)", "Drainage", "Concrete mix", "Pipe bedding"],
    notFor: ["Walking surfaces", "Decorative landscaping"],
    commonUses: ["Driveways", "Drainage", "Concrete", "Pipe bedding", "Backfill"],
    pros: [
      "Highly versatile across applications",
      "Excellent drainage",
      "Widely used and well understood",
      "Cost-effective for large projects",
    ],
    cons: [
      "Too coarse for comfortable walking",
      "Angular edges are sharp",
      "Needs a finer top layer for driveways",
    ],
    altNames: [],
    featured: true,
    sortOrder: 8,
  },
  {
    slug: "304-crushed-gravel",
    name: "#304 Crushed Gravel",
    category: "gravel",
    description:
      "Crushed limestone aggregate (#304) — a blend of larger crushed stone and fines. Compacts into a stable, solid surface ideal for driveways, parking areas, and base layers under pavers and patios.",
    shortDescription:
      "Crushed limestone aggregate that compacts solid. Ideal driveway and base material.",
    price: 20.0,
    unit: "ton",
    marketPriceLowPerTon: 18,
    marketPriceHighPerTon: 35,
    marketPriceLowPerYard: 22,
    marketPriceHighPerYard: 45,
    sizeDescription: "Crushed stone with fines",
    colorDescription: "Gray to tan",
    densityLow: 1.4,
    densityHigh: 1.55,
    bestFor: ["Driveways", "Parking areas", "Paver base", "Compacted base layers"],
    notFor: ["Decorative landscaping", "Drainage applications"],
    commonUses: ["Driveways", "Parking lots", "Paver base", "Road base"],
    pros: [
      "Compacts into a firm, solid surface",
      "Single-material driveway solution",
      "Affordable per ton",
      "Great for base layers",
    ],
    cons: [
      "Dusty when dry",
      "Holds water if drainage is poor",
      "Not decorative",
    ],
    altNames: ["304 limestone", "Crushed limestone base"],
    featured: true,
    sortOrder: 9,
  },
  {
    slug: "oversized-gravel-washed",
    name: "Oversized Gravel (Washed)",
    category: "gravel",
    description:
      "Large washed gravel for heavy drainage, erosion control, and decorative landscape features. Larger stones resist water flow and create dramatic visual impact.",
    shortDescription:
      "Large washed gravel for heavy drainage, erosion control, and decorative use.",
    price: 28.0,
    unit: "ton",
    marketPriceLowPerTon: 25,
    marketPriceHighPerTon: 50,
    marketPriceLowPerYard: 30,
    marketPriceHighPerYard: 65,
    sizeDescription: "Large washed gravel",
    colorDescription: "Mixed gray, blue, and tan",
    densityLow: 1.3,
    densityHigh: 1.5,
    bestFor: ["Heavy drainage", "Erosion control", "Decorative landscape features", "Slope stabilization"],
    notFor: ["Walking surfaces", "Driveway top dressing"],
    commonUses: ["Drainage", "Erosion control", "Landscape features", "Channel protection"],
    pros: [
      "Maximum drainage capacity",
      "Resists movement under water flow",
      "Visually dramatic",
    ],
    cons: [
      "Too large for walking",
      "Heavier to handle",
      "Higher cost per ton",
    ],
    altNames: [],
    featured: false,
    sortOrder: 10,
  },
  {
    slug: "57-limestone",
    name: "#57 Limestone",
    category: "stone",
    description:
      "Premium washed #57 limestone — bright, light-colored crushed limestone in the popular 3/4 to 1 inch size. A clean alternative to standard #57 gravel for driveways, drainage, and decorative landscaping.",
    shortDescription:
      "Premium 3/4\" to 1\" washed limestone. Bright color for driveways and landscaping.",
    price: 38.0,
    unit: "ton",
    marketPriceLowPerTon: 25,
    marketPriceHighPerTon: 50,
    marketPriceLowPerYard: 30,
    marketPriceHighPerYard: 65,
    sizeDescription: "3/4\" to 1\" washed limestone",
    colorDescription: "Light gray to nearly white",
    densityLow: 1.35,
    densityHigh: 1.55,
    bestFor: ["Driveways", "Decorative landscaping", "Drainage", "Pathways"],
    notFor: ["Heavy structural fill where color isn't important"],
    commonUses: ["Driveways", "Landscaping", "Drainage", "Decorative borders"],
    pros: [
      "Bright, clean appearance",
      "Excellent drainage",
      "Naturally suppresses weeds",
      "Premium decorative option",
    ],
    cons: [
      "Higher cost than standard #57 gravel",
      "Lighter color shows dirt over time",
    ],
    altNames: ["57 Limestone", "Washed limestone"],
    featured: true,
    sortOrder: 11,
  },
];

const COST_GUIDES_DATA = [
  {
    slug: "delivery-cost",
    title: "Gravel Delivery Cost",
    subtitle: "What to expect for delivery pricing",
    description:
      "Delivery adds $50-$200 to most gravel orders depending on distance and quantity. Understanding delivery costs helps you budget accurately for your project.",
    icon: "truck",
    sortOrder: 1,
    content: {
      priceRange: "$50-$200 added to order",
      perTonRange: "$20-$100 per ton delivered",
      perYardRange: "$25-$120 per yard delivered",
      sections: [
        {
          title: "Material Cost Ranges",
          items: [
            { material: "Crushed Stone", range: "$20-$40/ton" },
            { material: "#57 Gravel", range: "$20-$35/ton" },
            { material: "Pea Gravel", range: "$25-$50/ton" },
            { material: "River Rock", range: "$40-$100/ton" },
            { material: "Crusher Run", range: "$20-$35/ton" },
          ],
        },
        {
          title: "Truck Capacities",
          items: [
            { type: "Standard Tandem", capacity: "12-15 tons (8-10 yd³)" },
            { type: "Tri-Axle", capacity: "18-22 tons" },
            { type: "Super Dump", capacity: "24-26 tons" },
          ],
        },
        {
          title: "Delivery Distance Pricing",
          items: [
            { distance: "Local (10-20 mile radius)", cost: "$50-$100 flat rate" },
            { distance: "Extended radius", cost: "$100-$200+" },
            { distance: "Per-mile surcharge", cost: "$5-$10 per mile beyond base zone" },
          ],
        },
      ],
      tips: [
        "Free delivery is often available on orders of 5-10+ tons",
        "Ensure a minimum 10-foot-wide path for truck access",
        "Overhead clearance of 14 feet is required for dump trucks",
        "Muskingum Materials delivers up to 20 tons per load throughout Southeast Ohio",
      ],
    },
  },
  {
    slug: "driveway-cost",
    title: "Gravel Driveway Cost",
    subtitle: "Complete driveway cost breakdown",
    description:
      "A standard 12x50-foot single-car gravel driveway costs $1,500-$6,000, or $1.25-$3.00 per square foot installed. Learn about the three-layer system and cost components.",
    icon: "road",
    sortOrder: 2,
    content: {
      totalRange: "$1,500-$6,000",
      perSqFtRange: "$1.25-$3.00/sq ft installed",
      layers: [
        {
          name: "Base Layer (4\")",
          material: "#3 or #4 stone",
          cost: "$500-$800",
          purpose: "Structural foundation and drainage",
        },
        {
          name: "Middle Layer (4\")",
          material: "#57 gravel",
          cost: "$400-$700",
          purpose: "Transition layer and stability",
        },
        {
          name: "Top Layer (2-3\")",
          material: "#8 gravel or crushed limestone",
          cost: "$300-$600",
          purpose: "Driving surface and appearance",
        },
      ],
      costComponents: [
        { component: "Materials", percentage: "40-60% of total" },
        { component: "Labor", range: "$0.50-$1.50/sq ft" },
        { component: "Drainage & Grading", range: "$200-$800" },
        { component: "Edging", range: "$2-$5/linear ft" },
        { component: "Geotextile Fabric", range: "$0.30-$0.50/sq ft" },
      ],
      alternatives: [
        {
          name: "Crusher Run Single-Layer",
          cost: "$400-$700",
          note: "Budget option — one material does it all",
        },
        {
          name: "Gravel Driveway",
          cost: "$1-$3/sq ft",
          note: "10-15 year lifespan with maintenance",
        },
        {
          name: "Concrete Driveway",
          cost: "$5-$10/sq ft",
          note: "25-30 year lifespan",
        },
      ],
    },
  },
  {
    slug: "cost-per-yard",
    title: "Gravel Cost Per Yard",
    subtitle: "Cubic yard pricing for all materials",
    description:
      "Gravel costs $15-$75 per cubic yard depending on the type. One cubic yard covers about 100 square feet at 3 inches deep and weighs 1.2-1.7 tons.",
    icon: "cube",
    sortOrder: 3,
    content: {
      generalRange: "$15-$75 per cubic yard",
      coverageNote:
        "One cubic yard covers about 100 sq ft at 3 inches deep and weighs 1.2-1.7 tons",
      pricingTable: [
        { material: "#411 Gravel", low: 25, high: 55 },
        { material: "#57 Gravel", low: 25, high: 45 },
        { material: "#8 Gravel", low: 28, high: 50 },
        { material: "#89 Stone", low: 28, high: 50 },
        { material: "Bank Run Gravel", low: 20, high: 40 },
        { material: "Crushed Limestone", low: 25, high: 50 },
        { material: "Crushed Stone", low: 25, high: 55 },
        { material: "Crusher Run", low: 25, high: 45 },
        { material: "Decomposed Granite", low: 30, high: 50 },
        { material: "Fill Dirt", low: 8, high: 25 },
        { material: "Pea Gravel", low: 30, high: 60 },
        { material: "Recycled Asphalt", low: 20, high: 45 },
        { material: "Rip Rap", low: 45, high: 100 },
        { material: "River Rock", low: 45, high: 120 },
        { material: "Stone Dust", low: 20, high: 40 },
        { material: "Topsoil", low: 15, high: 40 },
        { material: "Washed Gravel", low: 30, high: 60 },
      ],
    },
  },
  {
    slug: "cost-per-ton",
    title: "Gravel Cost Per Ton",
    subtitle: "Per-ton pricing for all materials",
    description:
      "Gravel costs $10-$50 per ton for most common types. A ton of gravel covers approximately 80-100 square feet at 2 inches deep, or 50-60 square feet at 3 inches deep.",
    icon: "weight",
    sortOrder: 4,
    content: {
      generalRange: "$10-$50 per ton",
      coverageNote:
        "A ton of gravel covers approximately 80-100 sq ft at 2 inches deep, or 50-60 sq ft at 3 inches deep",
      pricingTable: [
        { material: "#411 Gravel", low: 20, high: 40 },
        { material: "#57 Gravel", low: 20, high: 35 },
        { material: "#8 Gravel", low: 22, high: 40 },
        { material: "#89 Stone", low: 22, high: 40 },
        { material: "Bank Run Gravel", low: 15, high: 30 },
        { material: "Crushed Limestone", low: 20, high: 45 },
        { material: "Crushed Stone", low: 20, high: 40 },
        { material: "Crusher Run", low: 20, high: 35 },
        { material: "Decomposed Granite", low: 25, high: 45 },
        { material: "Fill Dirt", low: 5, high: 15 },
        { material: "Pea Gravel", low: 25, high: 50 },
        { material: "Recycled Asphalt", low: 15, high: 30 },
        { material: "Rip Rap", low: 35, high: 80 },
        { material: "River Rock", low: 40, high: 100 },
        { material: "Stone Dust", low: 15, high: 30 },
        { material: "Topsoil", low: 12, high: 30 },
        { material: "Washed Gravel", low: 25, high: 45 },
      ],
    },
  },
];

const SERVICES_DATA = [
  {
    slug: "material-sales",
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
    sortOrder: 0,
  },
  {
    slug: "delivery-services",
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
    sortOrder: 1,
  },
  {
    slug: "large-project-pricing",
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
    sortOrder: 2,
  },
  {
    slug: "on-site-loading",
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
    sortOrder: 3,
  },
];

const EMAIL_TEMPLATES_DATA = [
  {
    name: "Welcome - Newsletter Subscriber",
    subject: "Welcome to Muskingum Materials Updates",
    category: "transactional",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin-top: 0;">Welcome to Muskingum Materials!</h1>
    <p>Thank you for subscribing to our newsletter. You'll now receive updates about:</p>
    <ul style="line-height: 2;">
      <li>Seasonal promotions and special offers</li>
      <li>New product arrivals</li>
      <li>Project tips and material guides</li>
      <li>Industry news and updates</li>
    </ul>
    <p>We're committed to providing quality materials and excellent service to Southeast Ohio.</p>
  </div>
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
    <p>Muskingum Materials | Southeast Ohio</p>
    <p><a href="{{unsubscribe_url}}" style="color: #2563eb;">Unsubscribe</a> from these emails</p>
  </div>
</body>
</html>`,
    textContent: `Welcome to Muskingum Materials!

Thank you for subscribing to our newsletter. You'll now receive updates about:

- Seasonal promotions and special offers
- New product arrivals
- Project tips and material guides
- Industry news and updates

We're committed to providing quality materials and excellent service to Southeast Ohio.

---
Muskingum Materials | Southeast Ohio
Unsubscribe: {{unsubscribe_url}}`,
    active: true,
  },
  {
    name: "Seasonal Promotion",
    subject: "Spring Into Your Projects - Special Offers Inside",
    category: "marketing",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 40px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin-top: 0; font-size: 32px;">{{season}} Promotion</h1>
    <p style="font-size: 18px; margin-bottom: 0;">{{promotion_headline}}</p>
  </div>

  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #2563eb; margin-top: 0;">Featured Products</h2>
    {{product_section}}

    <div style="margin-top: 30px; text-align: center;">
      <a href="{{cta_url}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Shop Now</a>
    </div>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
    <p>Muskingum Materials | Southeast Ohio</p>
    <p><a href="{{unsubscribe_url}}" style="color: #2563eb;">Unsubscribe</a> from these emails</p>
  </div>
</body>
</html>`,
    textContent: `{{season}} PROMOTION

{{promotion_headline}}

FEATURED PRODUCTS
{{product_section_text}}

Shop now: {{cta_url}}

---
Muskingum Materials | Southeast Ohio
Unsubscribe: {{unsubscribe_url}}`,
    active: true,
  },
  {
    name: "New Product Announcement",
    subject: "Now Available: {{product_name}}",
    category: "marketing",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
    <span style="font-size: 14px; font-weight: bold; text-transform: uppercase;">New Product</span>
  </div>

  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin-top: 0;">{{product_name}}</h1>

    {{product_image}}

    <p style="font-size: 18px; color: #4b5563;">{{product_description}}</p>

    <h3 style="color: #2563eb;">Perfect For:</h3>
    <ul style="line-height: 2;">
      {{benefits_list}}
    </ul>

    <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 24px; color: #2563eb; font-weight: bold; margin: 0;">{{pricing}}</p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="{{product_url}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Learn More</a>
    </div>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
    <p>Muskingum Materials | Southeast Ohio</p>
    <p><a href="{{unsubscribe_url}}" style="color: #2563eb;">Unsubscribe</a> from these emails</p>
  </div>
</body>
</html>`,
    textContent: `NEW PRODUCT AVAILABLE

{{product_name}}

{{product_description}}

Perfect For:
{{benefits_list_text}}

Pricing: {{pricing}}

Learn more: {{product_url}}

---
Muskingum Materials | Southeast Ohio
Unsubscribe: {{unsubscribe_url}}`,
    active: true,
  },
  {
    name: "General Newsletter",
    subject: "{{newsletter_title}}",
    category: "marketing",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #2563eb; color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin-top: 0;">{{newsletter_title}}</h1>
    <p style="font-size: 14px; margin-bottom: 0;">{{newsletter_date}}</p>
  </div>

  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    {{main_content}}
  </div>

  <div style="background-color: #fff7ed; padding: 20px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
    <h3 style="color: #f59e0b; margin-top: 0;">Project Tip</h3>
    {{project_tip}}
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{cta_url}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">{{cta_text}}</a>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
    <p>Muskingum Materials | Southeast Ohio</p>
    <p><a href="{{unsubscribe_url}}" style="color: #2563eb;">Unsubscribe</a> from these emails</p>
  </div>
</body>
</html>`,
    textContent: `{{newsletter_title}}
{{newsletter_date}}

{{main_content_text}}

PROJECT TIP
{{project_tip_text}}

{{cta_text}}: {{cta_url}}

---
Muskingum Materials | Southeast Ohio
Unsubscribe: {{unsubscribe_url}}`,
    active: true,
  },
  {
    name: "Order Confirmation",
    subject: "Order Confirmation - #{{order_number}}",
    category: "transactional",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #10b981; color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">Order Confirmed!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px;">Order #{{order_number}}</p>
  </div>

  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #2563eb; margin-top: 0;">Order Details</h2>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="border-bottom: 2px solid #e5e7eb;">
          <th style="text-align: left; padding: 10px 0;">Item</th>
          <th style="text-align: right; padding: 10px 0;">Quantity</th>
          <th style="text-align: right; padding: 10px 0;">Price</th>
        </tr>
      </thead>
      <tbody>
        {{order_items}}
      </tbody>
    </table>

    <div style="border-top: 2px solid #e5e7eb; padding-top: 15px;">
      <table style="width: 100%; font-size: 16px;">
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="text-align: right; padding: 5px 0;">\${{subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="text-align: right; padding: 5px 0;">\${{tax}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Delivery Fee:</td>
          <td style="text-align: right; padding: 5px 0;">\${{delivery_fee}}</td>
        </tr>
        <tr style="font-weight: bold; font-size: 18px; border-top: 2px solid #e5e7eb;">
          <td style="padding: 15px 0 0 0;">Total:</td>
          <td style="text-align: right; padding: 15px 0 0 0;">\${{total}}</td>
        </tr>
      </table>
    </div>

    <div style="margin-top: 30px;">
      <h3 style="color: #2563eb;">{{delivery_or_pickup}}</h3>
      <p>{{delivery_details}}</p>
    </div>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <p>Questions about your order?</p>
    <a href="{{contact_url}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Contact Us</a>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
    <p>Muskingum Materials | Southeast Ohio</p>
  </div>
</body>
</html>`,
    textContent: `ORDER CONFIRMED!
Order #{{order_number}}

ORDER DETAILS
{{order_items_text}}

Subtotal: \${{subtotal}}
Tax: \${{tax}}
Delivery Fee: \${{delivery_fee}}
---
Total: \${{total}}

{{delivery_or_pickup}}
{{delivery_details}}

Questions about your order?
Contact us: {{contact_url}}

---
Muskingum Materials | Southeast Ohio`,
    active: true,
  },
  {
    name: "Quote Request Confirmation",
    subject: "Quote Request Received - We'll Be In Touch Soon",
    category: "transactional",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #2563eb; color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin-top: 0;">Quote Request Received</h1>
    <p style="margin-bottom: 0;">We'll review your request and get back to you within 24 hours.</p>
  </div>

  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #2563eb; margin-top: 0;">Your Request</h2>

    <table style="width: 100%; margin-bottom: 20px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Name:</td>
        <td style="padding: 8px 0; font-weight: 500;">{{customer_name}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Email:</td>
        <td style="padding: 8px 0; font-weight: 500;">{{customer_email}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Phone:</td>
        <td style="padding: 8px 0; font-weight: 500;">{{customer_phone}}</td>
      </tr>
    </table>

    <h3 style="color: #2563eb;">Requested Materials</h3>
    {{requested_products}}

    <div style="background-color: white; padding: 15px; border-radius: 5px; margin-top: 20px;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Additional Notes:</p>
      <p style="margin: 10px 0 0 0;">{{customer_notes}}</p>
    </div>
  </div>

  <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="color: #2563eb; margin-top: 0;">What Happens Next?</h3>
    <ol style="line-height: 2; margin: 0; padding-left: 20px;">
      <li>We'll review your request and check current inventory</li>
      <li>We'll prepare a detailed quote with pricing and availability</li>
      <li>A team member will contact you within 24 hours</li>
    </ol>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
    <p>Muskingum Materials | Southeast Ohio</p>
  </div>
</body>
</html>`,
    textContent: `QUOTE REQUEST RECEIVED

We'll review your request and get back to you within 24 hours.

YOUR REQUEST
Name: {{customer_name}}
Email: {{customer_email}}
Phone: {{customer_phone}}

REQUESTED MATERIALS
{{requested_products_text}}

Additional Notes:
{{customer_notes}}

WHAT HAPPENS NEXT?
1. We'll review your request and check current inventory
2. We'll prepare a detailed quote with pricing and availability
3. A team member will contact you within 24 hours

---
Muskingum Materials | Southeast Ohio`,
    active: true,
  },
];


async function main() {
  // Clear existing data
  await prisma.productComparison.deleteMany();
  await prisma.costGuide.deleteMany();
  await prisma.product.deleteMany();

  // Seed products
  for (const product of PRODUCTS_DATA) {
    await prisma.product.create({ data: product });
  }

  // Seed cost guides
  for (const guide of COST_GUIDES_DATA) {
    await prisma.costGuide.create({ data: guide });
  }

  // Upsert services (idempotent — keeps existing rows in sync)
  for (const service of SERVICES_DATA) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      create: service,
      update: service,
    });
  }

  // Seed email templates
  await prisma.emailTemplate.deleteMany();
  for (const template of EMAIL_TEMPLATES_DATA) {
    await prisma.emailTemplate.create({ data: template });
  }

  const productCount = await prisma.product.count();
  const guideCount = await prisma.costGuide.count();
  const serviceCount = await prisma.service.count();
  const templateCount = await prisma.emailTemplate.count();
  process.stdout.write(
    `Seeded ${productCount} products, ${guideCount} cost guides, ${serviceCount} services, ${templateCount} email templates\n`
  );
}

main()
  .catch((e) => {
    process.stderr.write(String(e) + "\n");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
