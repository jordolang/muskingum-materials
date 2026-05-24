import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Catalog of products sold at the Zanesville yard. The 11 entries below match
// the printed price list distributed at the office (effective 07/03/2025).
// This array is the single source of truth seeded into Postgres — every page,
// API route, calculator, and chat prompt resolves products from the database
// at runtime, not from this file. Update prices here and re-run `npm run db:seed`
// to roll them out.
const PRODUCTS_DATA = [
  {
    slug: "bank-run",
    name: "Bank Run",
    category: "soil",
    description:
      "Natural unprocessed mix of sand, gravel, and soil pulled directly from the bank. Economical fill material for grading, building pads, and rough base where compaction matters more than appearance.",
    shortDescription:
      "Natural sand-gravel-soil mix. Economical fill and base material.",
    imageUrl: "/images/products/bank-run.jpg",
    imageAlt: "Pile of bank run material at the Muskingum Materials yard",
    price: 13.0,
    unit: "ton",
    sizeDescription: "Variable — natural mix of sand, gravel, and soil",
    colorDescription: "Brown to tan",
    densityLow: 1.4,
    densityHigh: 1.6,
    bestFor: ["Fill", "Grading", "Rough base"],
    notFor: ["Decorative use", "Finished surfaces"],
    commonUses: ["Site fill", "Building pads", "Driveway base"],
    pros: ["Most economical fill option", "Compacts well", "Versatile"],
    cons: ["Not screened or washed", "Variable composition"],
    altNames: ["Pit run", "Run of bank"],
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "fill-dirt",
    name: "Fill Dirt",
    category: "soil",
    description:
      "Clean fill dirt for grading, backfill, and structural fill. Free of organic matter so it compacts firmly and stays in place — not for growing plants.",
    shortDescription:
      "Clean fill for grading, backfill, and structural fill.",
    imageUrl: "/images/products/fill-dirt.jpg",
    imageAlt: "Pile of clean fill dirt",
    price: 7.0,
    unit: "ton",
    sizeDescription: "Sub-soil, screened of debris",
    colorDescription: "Brown",
    densityLow: 1.3,
    densityHigh: 1.5,
    bestFor: ["Grading", "Backfill", "Foundation prep"],
    notFor: ["Gardens", "Lawn establishment"],
    commonUses: ["Grading", "Backfill", "Raising low spots"],
    pros: ["Inexpensive", "Compacts well", "Stable structural fill"],
    cons: ["Not suitable for planting"],
    altNames: [],
    featured: false,
    sortOrder: 2,
  },
  {
    slug: "fill-sand-washed",
    name: "Fill Sand (Washed)",
    category: "sand",
    description:
      "Washed fill sand for construction backfill, paver bedding, and bedding for utility trenches. Drains well and compacts uniformly.",
    shortDescription:
      "Washed sand for backfill, paver bedding, and trenches.",
    imageUrl: "/images/products/fill-sand.jpg",
    imageAlt: "Washed fill sand pile",
    price: 4.0,
    unit: "ton",
    sizeDescription: "Fine washed sand",
    colorDescription: "Tan to light brown",
    densityLow: 1.3,
    densityHigh: 1.5,
    bestFor: ["Backfill", "Paver bedding", "Pipe bedding"],
    notFor: ["Concrete mix (use mason sand)", "Decorative use"],
    commonUses: ["Trench backfill", "Paver setting bed", "Construction fill"],
    pros: ["Drains well", "Compacts uniformly", "Inexpensive"],
    cons: ["Shifts under load without confinement"],
    altNames: ["Construction sand"],
    featured: false,
    sortOrder: 3,
  },
  {
    slug: "topsoil-unprocessed",
    name: "Topsoil (Unprocessed)",
    category: "soil",
    description:
      "Natural unprocessed topsoil straight from the field. Rich in organic matter for landscaping, gardening, and lawn establishment. May contain rocks, roots, or clumps — call ahead if you need screened topsoil for finish work.",
    shortDescription:
      "Natural topsoil for landscaping, gardens, and lawn establishment.",
    imageUrl: "/images/products/topsoil.jpg",
    imageAlt: "Pile of unprocessed topsoil",
    price: 10.0,
    unit: "ton",
    sizeDescription: "Unscreened — may contain rocks and organic matter",
    colorDescription: "Dark brown",
    densityLow: 1.0,
    densityHigh: 1.3,
    bestFor: ["Gardens", "Lawn establishment", "Landscaping"],
    notFor: ["Structural fill", "Driveway base"],
    commonUses: ["Garden beds", "New lawns", "Tree planting", "Berms"],
    pros: ["Rich in organic matter", "Inexpensive", "Supports plant growth"],
    cons: ["Unscreened — debris possible", "Settles over time"],
    altNames: [],
    featured: false,
    sortOrder: 4,
  },
  {
    slug: "4-fractured-gravel-washed",
    name: "#4 Fractured Gravel (Washed)",
    category: "gravel",
    description:
      "Washed #4 fractured stone — angular crushed gravel approximately 1.5 to 2.5 inches. Ideal for heavy drainage, base under driveways, and any application that needs both bulk and locking edges.",
    shortDescription:
      "Washed 1.5\"–2.5\" fractured stone for heavy drainage and base.",
    imageUrl: "/images/products/fractured-gravel.jpg",
    imageAlt: "Washed #4 fractured gravel",
    price: 28.0,
    unit: "ton",
    sizeDescription: "1.5\" to 2.5\" angular crushed stone",
    colorDescription: "Gray",
    densityLow: 1.4,
    densityHigh: 1.55,
    bestFor: ["Heavy drainage", "Driveway base", "Erosion control"],
    notFor: ["Walking surfaces", "Decorative landscaping"],
    commonUses: ["French drains", "Driveway base", "Stabilization"],
    pros: ["Excellent drainage", "Angular edges lock together", "Heavy duty"],
    cons: ["Too coarse to walk on", "Requires top dressing for driveways"],
    altNames: ["#4 stone"],
    featured: true,
    sortOrder: 5,
  },
  {
    slug: "9-gravel-washed",
    name: "#9 Gravel (Washed)",
    category: "gravel",
    description:
      "Fine washed gravel, roughly 1/8 to 3/8 inch. Ideal for pipe bedding, drainage layers, and as a leveling course under pavers.",
    shortDescription:
      "Fine 1/8\"–3/8\" washed gravel. Pipe bedding and drainage layers.",
    imageUrl: "/images/products/fine-gravel.jpg",
    imageAlt: "Fine washed #9 gravel",
    price: 9.0,
    unit: "ton",
    sizeDescription: "1/8\" to 3/8\" washed crushed stone",
    colorDescription: "Gray",
    densityLow: 1.4,
    densityHigh: 1.55,
    bestFor: ["Pipe bedding", "Drainage layers", "Paver leveling"],
    notFor: ["Driveway top course", "Heavy traffic surfaces"],
    commonUses: ["Pipe bedding", "Underdrains", "Paver setting bed"],
    pros: ["Smooth fine size", "Drains well", "Easy to spread"],
    cons: ["Too small for surface use", "Washes out without confinement"],
    altNames: ["#9 stone"],
    featured: false,
    sortOrder: 6,
  },
  {
    slug: "8-gravel-washed",
    name: "#8 Gravel (Washed)",
    category: "gravel",
    description:
      "Washed 3/8 inch crushed stone. A favorite for concrete mix, drainage chips, and decorative applications where a clean uniform stone is needed.",
    shortDescription:
      "Washed 3/8\" crushed stone for concrete, drainage, and decoration.",
    imageUrl: "/images/photos/stone-close-up.jpg",
    imageAlt: "Washed #8 gravel close up",
    price: 15.0,
    unit: "ton",
    sizeDescription: "3/8\" angular crushed stone",
    colorDescription: "Gray",
    densityLow: 1.4,
    densityHigh: 1.55,
    bestFor: ["Concrete mix", "Drainage chips", "Decorative paths"],
    notFor: ["Heavy structural fill"],
    commonUses: ["Concrete production", "Decorative", "Drainage"],
    pros: ["Clean uniform size", "Versatile", "Visually clean"],
    cons: ["Shifts under heavy traffic"],
    altNames: ["#8 stone"],
    featured: false,
    sortOrder: 7,
  },
  {
    slug: "57-gravel-washed",
    name: "#57 Gravel (Washed)",
    category: "gravel",
    description:
      "Washed 3/4 to 1 inch crushed stone — the most versatile aggregate we sell. Excellent for driveways, drainage trenches, foundation backfill, and concrete production.",
    shortDescription:
      "Washed 3/4\"–1\" crushed stone. Driveways, drainage, and concrete.",
    imageUrl: "/images/photos/piles-close-up.jpg",
    imageAlt: "Pile of washed #57 gravel",
    price: 19.5,
    unit: "ton",
    sizeDescription: "3/4\" to 1\" angular crushed stone",
    colorDescription: "Gray",
    densityLow: 1.35,
    densityHigh: 1.55,
    bestFor: ["Driveways", "Drainage", "Concrete mix", "Foundation backfill"],
    notFor: ["Walking surfaces (too coarse)"],
    commonUses: ["Driveways", "French drains", "Concrete", "Pipe bedding"],
    pros: ["Most versatile aggregate", "Excellent drainage", "Widely used"],
    cons: ["Sharp edges", "Shifts without edging"],
    altNames: ["#57 stone"],
    featured: true,
    sortOrder: 8,
  },
  {
    slug: "304-crushed-gravel",
    name: "#304 Crushed Gravel",
    category: "gravel",
    description:
      "Dense-graded crushed gravel blending stone and fines. Compacts into a hard, smooth driving surface — the standard choice for finished gravel driveways and parking areas.",
    shortDescription:
      "Dense-graded gravel that compacts into a hard driveway surface.",
    imageUrl: "/images/photos/piles-7.jpg",
    imageAlt: "Pile of #304 crushed gravel",
    price: 20.0,
    unit: "ton",
    sizeDescription: "Blend of crushed stone up to 1\" with fines",
    colorDescription: "Gray",
    densityLow: 1.4,
    densityHigh: 1.6,
    bestFor: ["Driveways", "Parking areas", "Compacted base"],
    notFor: ["Drainage applications", "Decorative use"],
    commonUses: ["Driveways", "Road base", "Paver base"],
    pros: ["Compacts hard", "Smooth driving surface", "Cost effective"],
    cons: ["Dusty when dry", "Poor drainage"],
    altNames: ["304 limestone", "Crusher run"],
    featured: true,
    sortOrder: 9,
  },
  {
    slug: "oversized-gravel-washed",
    name: "Oversized Gravel (Washed)",
    category: "gravel",
    description:
      "Large washed stone, generally 2 inches and up. Used for erosion control, decorative water features, and drainage in high-flow areas.",
    shortDescription:
      "Large 2\"+ washed stone for erosion control and decorative drainage.",
    imageUrl: "/images/photos/stone-hand.jpg",
    imageAlt: "Hand holding oversized washed gravel",
    price: 28.0,
    unit: "ton",
    sizeDescription: "2\"+ washed stone",
    colorDescription: "Gray to brown",
    densityLow: 1.4,
    densityHigh: 1.55,
    bestFor: ["Erosion control", "Decorative drainage", "Slope stabilization"],
    notFor: ["Driveways", "Walking surfaces"],
    commonUses: ["Channel armor", "Decorative borders", "Heavy drainage"],
    pros: ["Heavy and stable", "Decorative", "Resists movement"],
    cons: ["Too large for most surfaces"],
    altNames: [],
    featured: false,
    sortOrder: 10,
  },
  {
    slug: "57-limestone",
    name: "#57 Limestone",
    category: "stone",
    description:
      "Premium washed limestone aggregate, 3/4 to 1 inch. Bright color and clean appearance make it a favorite for high-end driveways, landscape borders, and exposed aggregate finishes.",
    shortDescription:
      "Washed limestone aggregate for premium driveways and landscaping.",
    imageUrl: "/images/photos/boulders.jpg",
    imageAlt: "Pile of #57 limestone",
    price: 38.0,
    unit: "ton",
    sizeDescription: "3/4\" to 1\" washed limestone",
    colorDescription: "Light gray to white",
    densityLow: 1.4,
    densityHigh: 1.55,
    bestFor: ["Premium driveways", "Landscape borders", "Exposed aggregate"],
    notFor: ["Heavy structural fill"],
    commonUses: ["Driveways", "Landscape", "Decorative aggregate"],
    pros: ["Bright clean color", "Compacts well", "Naturally suppresses weeds"],
    cons: ["Higher price than standard gravel"],
    altNames: ["57 lime", "Washed limestone"],
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

  // Create comparisons between related products
  const allProducts = await prisma.product.findMany();
  const slugMap = new Map(allProducts.map((p) => [p.slug, p]));

  const comparisons = [
    {
      a: "fill-dirt",
      b: "topsoil-unprocessed",
      summary:
        "Fill dirt is structural — it compacts firmly and won't decompose. Topsoil supports plant growth — rich in nutrients but settles over time. Use fill dirt for grading and pads, topsoil for gardens and lawns.",
    },
    {
      a: "8-gravel-washed",
      b: "57-gravel-washed",
      summary:
        "#8 (3/8\") is smaller and more comfortable for walking and decorative paths. #57 (3/4\"-1\") is larger and excels at drainage and driveway base.",
    },
    {
      a: "9-gravel-washed",
      b: "8-gravel-washed",
      summary:
        "#9 is a fine 1/8\"–3/8\" stone for pipe bedding and paver leveling. #8 is a uniform 3/8\" stone for concrete mix and decorative chips.",
    },
    {
      a: "304-crushed-gravel",
      b: "57-gravel-washed",
      summary:
        "#304 contains fines that compact into a hard driveway surface. #57 is washed clean for drainage. Most driveways use #304 on top of a #57 base.",
    },
    {
      a: "4-fractured-gravel-washed",
      b: "oversized-gravel-washed",
      summary:
        "#4 fractured (1.5\"–2.5\") is angular and locks together — ideal for heavy drainage and stabilized base. Oversized (2\"+) is larger and used for erosion control and high-flow drainage.",
    },
    {
      a: "57-gravel-washed",
      b: "57-limestone",
      summary:
        "#57 gravel and #57 limestone share the same 3/4\"–1\" size, but limestone is brighter and lighter — preferred for premium driveways and decorative finishes at a higher price point.",
    },
  ];

  for (const comp of comparisons) {
    const productA = slugMap.get(comp.a);
    const productB = slugMap.get(comp.b);
    if (productA && productB) {
      await prisma.productComparison.create({
        data: {
          productAId: productA.id,
          productBId: productB.id,
          summary: comp.summary,
        },
      });
    }
  }

  const productCount = await prisma.product.count();
  const guideCount = await prisma.costGuide.count();
  const compCount = await prisma.productComparison.count();
  const serviceCount = await prisma.service.count();
  const templateCount = await prisma.emailTemplate.count();
  process.stdout.write(
    `Seeded ${productCount} products, ${guideCount} cost guides, ${compCount} comparisons, ${serviceCount} services, ${templateCount} email templates\n`
  );
}

main()
  .catch((e) => {
    process.stderr.write(String(e) + "\n");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
