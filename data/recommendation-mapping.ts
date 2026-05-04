/**
 * Recommendation Mapping Configuration
 *
 * Maps project types to recommended products with reasoning and priority.
 * This data structure drives the material recommendation wizard.
 */

export type ProjectType =
  | "driveway"
  | "landscaping"
  | "drainage"
  | "fill"
  | "patio"
  | "walkway"
  | "foundation"
  | "erosion-control"
  | "decorative";

export type AreaSize = "small" | "medium" | "large";

export interface ProductRecommendation {
  productSlug: string;
  priority: number; // 1 = highest priority
  reasoning: string;
  idealFor: string[];
  quantityFactor?: number; // Multiplier for area-based calculations (tons per sq ft)
  minQuantity?: number; // Minimum recommended quantity in tons
}

export interface ProjectTypeMapping {
  type: ProjectType;
  label: string;
  description: string;
  icon: string; // lucide-react icon name
  recommendations: ProductRecommendation[];
  estimatedDepth?: string; // Recommended depth for area calculations
}

export const PROJECT_TYPE_MAPPINGS: ProjectTypeMapping[] = [
  {
    type: "driveway",
    label: "Driveway",
    description: "New driveway construction or resurfacing",
    icon: "car",
    estimatedDepth: "4-6 inches",
    recommendations: [
      {
        productSlug: "304-crushed-gravel",
        priority: 1,
        reasoning: "Best for driveways - compacts well, provides stable base, excellent drainage",
        idealFor: ["Base layer", "All-weather access", "Heavy vehicle traffic"],
        quantityFactor: 0.012, // tons per sq ft for 4" depth
        minQuantity: 3,
      },
      {
        productSlug: "57-gravel-washed",
        priority: 2,
        reasoning: "Popular choice for driveways - good drainage and appearance",
        idealFor: ["Top layer", "Decorative finish", "Residential driveways"],
        quantityFactor: 0.01,
        minQuantity: 2,
      },
      {
        productSlug: "4-fractured-gravel-washed",
        priority: 3,
        reasoning: "Larger fractured stones lock together for a stable, free-draining base",
        idealFor: ["Heavy base layer", "Drainage", "Long-lasting driveways"],
        quantityFactor: 0.008,
        minQuantity: 2,
      },
    ],
  },
  {
    type: "landscaping",
    label: "Landscaping",
    description: "Garden beds, decorative features, or ground cover",
    icon: "flower-2",
    estimatedDepth: "2-3 inches",
    recommendations: [
      {
        productSlug: "topsoil-unprocessed",
        priority: 1,
        reasoning: "Essential for plant growth - natural organic matter and nutrients",
        idealFor: ["Garden beds", "Planting areas", "Lawn establishment"],
        quantityFactor: 0.005,
        minQuantity: 1,
      },
      {
        productSlug: "57-limestone",
        priority: 2,
        reasoning: "Bright premium limestone — decorative finish that suppresses weeds and drains well",
        idealFor: ["Decorative borders", "Ground cover", "Low maintenance"],
        minQuantity: 1,
      },
      {
        productSlug: "57-gravel-washed",
        priority: 3,
        reasoning: "Versatile landscaping material - clean appearance and good drainage",
        idealFor: ["Pathways", "Mulch alternative", "Decorative features"],
        quantityFactor: 0.008,
        minQuantity: 1,
      },
    ],
  },
  {
    type: "drainage",
    label: "Drainage",
    description: "French drains, yard drainage, or water management",
    icon: "droplet",
    estimatedDepth: "12-18 inches",
    recommendations: [
      {
        productSlug: "57-gravel-washed",
        priority: 1,
        reasoning: "Ideal drainage stone - optimal void space for water flow",
        idealFor: ["French drains", "Drainage trenches", "Foundation drainage"],
        quantityFactor: 0.025,
        minQuantity: 2,
      },
      {
        productSlug: "9-gravel-washed",
        priority: 2,
        reasoning: "Fine gravel perfect for pipe bedding and drainage layers",
        idealFor: ["Pipe bedding", "Drainage layers", "Under-drain systems"],
        quantityFactor: 0.015,
        minQuantity: 1,
      },
      {
        productSlug: "oversized-gravel-washed",
        priority: 3,
        reasoning: "Large stones create maximum drainage capacity",
        idealFor: ["Heavy drainage", "Erosion prevention", "Large projects"],
        quantityFactor: 0.03,
        minQuantity: 3,
      },
    ],
  },
  {
    type: "fill",
    label: "Fill / Grading",
    description: "Backfill, grading, or land leveling",
    icon: "mountain",
    estimatedDepth: "Variable",
    recommendations: [
      {
        productSlug: "bank-run",
        priority: 1,
        reasoning: "Most economical fill material - compacts well for solid base",
        idealFor: ["Large fill projects", "Grading", "Cost-effective base"],
        quantityFactor: 0.015,
        minQuantity: 5,
      },
      {
        productSlug: "fill-dirt",
        priority: 2,
        reasoning: "Clean fill dirt - perfect for grading and backfill",
        idealFor: ["Grading", "Backfill", "Foundation prep"],
        quantityFactor: 0.012,
        minQuantity: 3,
      },
      {
        productSlug: "fill-sand-washed",
        priority: 3,
        reasoning: "Quality washed fill sand for construction and backfill",
        idealFor: ["Backfill", "Construction base", "Compaction"],
        quantityFactor: 0.01,
        minQuantity: 2,
      },
    ],
  },
  {
    type: "patio",
    label: "Patio / Paver Base",
    description: "Patio construction or paver installation",
    icon: "square",
    estimatedDepth: "4-6 inches base + 1 inch leveling",
    recommendations: [
      {
        productSlug: "304-crushed-gravel",
        priority: 1,
        reasoning: "Excellent base material - compacts solid and stays level",
        idealFor: ["Paver base", "Patio foundation", "Stable surface"],
        quantityFactor: 0.012,
        minQuantity: 2,
      },
      {
        productSlug: "8-gravel-washed",
        priority: 2,
        reasoning: "Small washed gravel — ideal final leveling layer under pavers",
        idealFor: ["Leveling layer", "Between pavers", "Drainage under pavers"],
        quantityFactor: 0.008,
        minQuantity: 1,
      },
      {
        productSlug: "9-gravel-washed",
        priority: 3,
        reasoning: "Fine washed gravel — flows into joints and tight spaces",
        idealFor: ["Drainage layer", "Tight backfill", "Under pavers"],
        quantityFactor: 0.008,
        minQuantity: 1,
      },
    ],
  },
  {
    type: "walkway",
    label: "Walkway / Path",
    description: "Garden paths, walking trails, or pathways",
    icon: "footprints",
    estimatedDepth: "2-4 inches",
    recommendations: [
      {
        productSlug: "8-gravel-washed",
        priority: 1,
        reasoning: "Comfortable walking surface — small washed stone that compacts well",
        idealFor: ["Garden paths", "Walking trails", "Smooth surface"],
        quantityFactor: 0.008,
        minQuantity: 1,
      },
      {
        productSlug: "57-gravel-washed",
        priority: 2,
        reasoning: "Classic pathway material — attractive and free-draining",
        idealFor: ["Casual paths", "Natural look", "Good drainage"],
        quantityFactor: 0.008,
        minQuantity: 1,
      },
      {
        productSlug: "57-limestone",
        priority: 3,
        reasoning: "Bright premium limestone for decorative, formal pathways",
        idealFor: ["Formal paths", "Decorative borders", "Bright surface"],
        quantityFactor: 0.008,
        minQuantity: 1,
      },
    ],
  },
  {
    type: "foundation",
    label: "Foundation Work",
    description: "Foundation backfill or drainage",
    icon: "home",
    estimatedDepth: "Variable",
    recommendations: [
      {
        productSlug: "57-gravel-washed",
        priority: 1,
        reasoning: "Standard for foundation drainage - prevents water accumulation",
        idealFor: ["Foundation drainage", "Backfill", "Water management"],
        quantityFactor: 0.02,
        minQuantity: 3,
      },
      {
        productSlug: "fill-dirt",
        priority: 2,
        reasoning: "Clean backfill material for foundation work",
        idealFor: ["Backfill", "Grading", "Foundation prep"],
        quantityFactor: 0.015,
        minQuantity: 3,
      },
      {
        productSlug: "9-gravel-washed",
        priority: 3,
        reasoning: "Fine gravel for pipe bedding and drainage systems",
        idealFor: ["Pipe bedding", "Drainage tiles", "Under-drain"],
        quantityFactor: 0.012,
        minQuantity: 2,
      },
    ],
  },
  {
    type: "erosion-control",
    label: "Erosion Control",
    description: "Prevent soil erosion or stabilize slopes",
    icon: "shield",
    estimatedDepth: "6-12 inches",
    recommendations: [
      {
        productSlug: "oversized-gravel-washed",
        priority: 1,
        reasoning: "Large stones resist water flow and stabilize slopes",
        idealFor: ["Slope stabilization", "Heavy erosion", "Water flow areas"],
        quantityFactor: 0.025,
        minQuantity: 3,
      },
      {
        productSlug: "57-gravel-washed",
        priority: 2,
        reasoning: "Versatile erosion control - good for moderate slopes",
        idealFor: ["Moderate erosion", "Drainage swales", "Channel protection"],
        quantityFactor: 0.02,
        minQuantity: 2,
      },
      {
        productSlug: "57-limestone",
        priority: 3,
        reasoning: "Bright premium limestone — decorative erosion control for garden areas",
        idealFor: ["Decorative slopes", "Garden areas", "Light erosion"],
        minQuantity: 2,
      },
    ],
  },
  {
    type: "decorative",
    label: "Decorative / Garden Features",
    description: "Rock gardens, water features, or decorative accents",
    icon: "sparkles",
    estimatedDepth: "2-4 inches",
    recommendations: [
      {
        productSlug: "57-limestone",
        priority: 1,
        reasoning: "Bright premium limestone — beautiful decorative stone for visual impact",
        idealFor: ["Rock gardens", "Water features", "Decorative borders"],
        minQuantity: 1,
      },
      {
        productSlug: "oversized-gravel-washed",
        priority: 2,
        reasoning: "Large stones create dramatic visual effects",
        idealFor: ["Statement pieces", "Water features", "Large displays"],
        quantityFactor: 0.015,
        minQuantity: 1,
      },
      {
        productSlug: "57-limestone",
        priority: 3,
        reasoning: "Bright washed limestone — clean, uniform appearance for refined landscapes",
        idealFor: ["Modern landscapes", "Clean lines", "Decorative borders"],
        quantityFactor: 0.008,
        minQuantity: 1,
      },
    ],
  },
] as const;

/**
 * Area size definitions for quantity estimation
 */
export const AREA_SIZE_RANGES = {
  small: {
    label: "Small",
    description: "Up to 200 sq ft",
    minSqFt: 0,
    maxSqFt: 200,
    typicalSqFt: 100,
  },
  medium: {
    label: "Medium",
    description: "200-500 sq ft",
    minSqFt: 200,
    maxSqFt: 500,
    typicalSqFt: 350,
  },
  large: {
    label: "Large",
    description: "500+ sq ft",
    minSqFt: 500,
    maxSqFt: 10000,
    typicalSqFt: 750,
  },
} as const;

/**
 * Delivery preferences
 */
export const DELIVERY_OPTIONS = [
  {
    value: "pickup",
    label: "Pick Up",
    description: "I'll pick up materials myself",
    icon: "truck",
  },
  {
    value: "delivery",
    label: "Delivery",
    description: "Deliver to my project site",
    icon: "package",
  },
  {
    value: "unsure",
    label: "Not Sure",
    description: "Help me decide",
    icon: "help-circle",
  },
] as const;

/**
 * Helper function to get project type mapping by type
 */
export function getProjectTypeMapping(type: ProjectType): ProjectTypeMapping | undefined {
  return PROJECT_TYPE_MAPPINGS.find((mapping) => mapping.type === type);
}

/**
 * Helper function to get all project types for selection
 */
export function getAllProjectTypes(): ProjectTypeMapping[] {
  return [...PROJECT_TYPE_MAPPINGS];
}
