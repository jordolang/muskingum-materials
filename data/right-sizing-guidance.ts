/**
 * Right-Sizing Guidance Configuration
 *
 * Provides material-specific recommendations for accurate quantity estimation,
 * including adjustment factors for compaction, waste, irregular areas, and
 * project-specific considerations.
 */

export type MaterialCategory =
  | "gravel"
  | "crushed-stone"
  | "limestone"
  | "sand"
  | "soil"
  | "asphalt-millings"
  | "fill";

export type ProjectCondition =
  | "ideal"
  | "irregular-area"
  | "soft-ground"
  | "heavy-compaction"
  | "hand-spreading"
  | "equipment-spreading";

export interface AdjustmentFactor {
  condition: ProjectCondition;
  label: string;
  description: string;
  adjustmentPercent: number; // Percentage to add to base calculation
  reasoning: string;
}

export interface MaterialGuidance {
  materialSlug: string;
  category: MaterialCategory;
  baseCompactionFactor: number; // Percentage loss due to compaction (e.g., 0.1 = 10%)
  confidenceRange: {
    low: number; // Minimum adjustment percent
    typical: number; // Typical adjustment percent
    high: number; // Maximum adjustment percent
    description: string;
  };
  adjustmentFactors: AdjustmentFactor[];
  depthConsiderations: string[];
  commonMistakes: string[];
  tips: string[];
}

export interface RightSizingRule {
  id: string;
  title: string;
  description: string;
  appliesTo: MaterialCategory[];
  recommendedAdjustment: number; // Percentage
  priority: number; // 1 = highest
}

export const MATERIAL_GUIDANCE: MaterialGuidance[] = [
  {
    materialSlug: "304-crushed-gravel",
    category: "crushed-stone",
    baseCompactionFactor: 0.15,
    confidenceRange: {
      low: 5,
      typical: 10,
      high: 15,
      description: "Dense-graded material compacts significantly — plan for 10-15% loss on average",
    },
    adjustmentFactors: [
      {
        condition: "ideal",
        label: "Ideal Conditions",
        description: "Clean rectangular area, firm ground, equipment compaction",
        adjustmentPercent: 5,
        reasoning: "Minimal waste with controlled spreading and compaction",
      },
      {
        condition: "irregular-area",
        label: "Irregular Area",
        description: "Curved edges, varying width, uneven boundaries",
        adjustmentPercent: 10,
        reasoning: "Extra material needed to fill irregular edges and transitions",
      },
      {
        condition: "soft-ground",
        label: "Soft or Muddy Ground",
        description: "Weak subgrade that may sink or require extra base depth",
        adjustmentPercent: 20,
        reasoning: "Soft ground absorbs material and requires deeper base for stability",
      },
      {
        condition: "heavy-compaction",
        label: "Heavy Compaction Required",
        description: "Commercial drive, heavy equipment, or high-traffic area",
        adjustmentPercent: 15,
        reasoning: "Extra compaction for load-bearing capacity reduces final volume",
      },
      {
        condition: "hand-spreading",
        label: "Hand Spreading",
        description: "Manual spreading with rake or shovel instead of equipment",
        adjustmentPercent: 8,
        reasoning: "Hand spreading is less precise than machine grading",
      },
    ],
    depthConsiderations: [
      "Light residential refresh: 2-3 inches of top stone",
      "New driveway base: 4-6 inches compacted",
      "Heavy traffic or weak ground: 6-8 inches or more",
      "Every extra inch of depth significantly increases tonnage",
    ],
    commonMistakes: [
      "Forgetting to account for compaction loss",
      "Measuring depth after compaction instead of before",
      "Not adding extra for soft spots or irregularities",
      "Underestimating depth needed for heavy vehicles",
    ],
    tips: [
      "Measure depth in multiple spots if ground is uneven",
      "Add 10% for irregular driveways with curves or varying width",
      "Soft or muddy areas often need 2x the normal depth",
      "Order in phases if unsure — easier to add than remove excess",
    ],
  },
  {
    materialSlug: "57-gravel-washed",
    category: "gravel",
    baseCompactionFactor: 0.08,
    confidenceRange: {
      low: 5,
      typical: 8,
      high: 12,
      description: "Washed gravel has less compaction loss than dense-graded stone",
    },
    adjustmentFactors: [
      {
        condition: "ideal",
        label: "Ideal Conditions",
        description: "Flat area, firm base, known depth",
        adjustmentPercent: 5,
        reasoning: "Clean washed stone spreads predictably with minimal settling",
      },
      {
        condition: "irregular-area",
        label: "Irregular Area",
        description: "Garden beds, curved paths, or decorative borders",
        adjustmentPercent: 10,
        reasoning: "Irregular shapes require extra material for clean edges",
      },
      {
        condition: "equipment-spreading",
        label: "Equipment Spreading",
        description: "Using skid steer, tractor, or grading equipment",
        adjustmentPercent: 5,
        reasoning: "Equipment spreads efficiently with minimal waste",
      },
      {
        condition: "hand-spreading",
        label: "Hand Spreading",
        description: "Manual raking or shoveling into place",
        adjustmentPercent: 8,
        reasoning: "Hand work is less precise and may need touch-up material",
      },
    ],
    depthConsiderations: [
      "Drainage applications: 12-18 inches typical for French drains",
      "Driveway top layer: 2-3 inches over compacted base",
      "Landscaping or paths: 2-4 inches for walking comfort",
      "Foundation drainage: Varies by code and site conditions",
    ],
    commonMistakes: [
      "Not accounting for void space in drainage applications",
      "Skimping on depth for drainage — reduces effectiveness",
      "Forgetting that washed stone settles less than crushed base",
      "Ordering by area alone without checking depth requirements",
    ],
    tips: [
      "For drainage, depth matters more than area — don't cut corners",
      "Washed stone is a finish material — add 5% cushion, not 20%",
      "Measure trench depth at multiple points if ground slopes",
      "Consider delivery in stages for large drainage projects",
    ],
  },
  {
    materialSlug: "topsoil-unprocessed",
    category: "soil",
    baseCompactionFactor: 0.25,
    confidenceRange: {
      low: 15,
      typical: 20,
      high: 30,
      description: "Topsoil settles significantly — always order extra for organic material loss",
    },
    adjustmentFactors: [
      {
        condition: "ideal",
        label: "Ideal Conditions",
        description: "Level lawn area, firm subgrade, shallow depth",
        adjustmentPercent: 15,
        reasoning: "Even under ideal conditions, topsoil compacts and settles over time",
      },
      {
        condition: "irregular-area",
        label: "Irregular Garden Beds",
        description: "Multiple beds, around trees, curved borders",
        adjustmentPercent: 25,
        reasoning: "Irregular areas are hard to measure precisely and often need more material",
      },
      {
        condition: "soft-ground",
        label: "Rough or Uneven Ground",
        description: "Filling low spots or leveling bumpy terrain",
        adjustmentPercent: 30,
        reasoning: "Uneven ground requires extra material to level, plus settling loss",
      },
    ],
    depthConsiderations: [
      "New lawn: 4-6 inches of topsoil over firm subgrade",
      "Garden beds: 6-12 inches depending on plants",
      "Thin top dressing: 1-2 inches to refresh existing lawn",
      "Deep planting beds: 12-18 inches for vegetables or perennials",
    ],
    commonMistakes: [
      "Not accounting for 20-30% settling over the first season",
      "Spreading topsoil too thin — less than 3 inches often fails",
      "Using topsoil as structural fill instead of for planting",
      "Forgetting that wet topsoil weighs much more than dry",
    ],
    tips: [
      "Always add 20-25% extra for settling and low spots",
      "Order in bulk for large lawn projects — pickup loads are inefficient",
      "Let topsoil settle for a few weeks before seeding if possible",
      "Mix compost or amendments in after delivery, not before measuring",
    ],
  },
  {
    materialSlug: "bank-run",
    category: "fill",
    baseCompactionFactor: 0.12,
    confidenceRange: {
      low: 8,
      typical: 12,
      high: 20,
      description: "Bank run compacts moderately — economical but less predictable than processed stone",
    },
    adjustmentFactors: [
      {
        condition: "ideal",
        label: "Large Fill Project",
        description: "Big open area, equipment access, rough grading",
        adjustmentPercent: 10,
        reasoning: "Bank run is cost-effective for large fills where precision is less critical",
      },
      {
        condition: "soft-ground",
        label: "Soft or Wet Ground",
        description: "Low areas, poor drainage, or muddy subgrade",
        adjustmentPercent: 20,
        reasoning: "Soft ground absorbs fill material unpredictably — order extra",
      },
      {
        condition: "heavy-compaction",
        label: "Heavy Compaction",
        description: "Building pad, driveway base, or structural fill",
        adjustmentPercent: 15,
        reasoning: "Compaction reduces volume significantly in mixed-graded material",
      },
    ],
    depthConsiderations: [
      "Rough grading or large fill: 12-24 inches or more",
      "Driveway sub-base: 6-12 inches under proper base stone",
      "Building up low areas: Depth varies widely by site",
      "Not a finish material — plan for topping with cleaner stone or soil",
    ],
    commonMistakes: [
      "Using bank run as a finish layer — it is a rough fill material",
      "Not planning for a top layer of cleaner material",
      "Underestimating how much soft ground will absorb",
      "Expecting bank run to compact as tightly as processed aggregate",
    ],
    tips: [
      "Bank run is economical for large volume — save money on base, not finish",
      "Plan for 6-12 inches of proper base stone over bank run for driveways",
      "Wet or soft areas can consume 2-3x expected material",
      "Get a site visit or call with photos before ordering large fills",
    ],
  },
  {
    materialSlug: "fill-sand-washed",
    category: "sand",
    baseCompactionFactor: 0.1,
    confidenceRange: {
      low: 5,
      typical: 10,
      high: 15,
      description: "Washed sand compacts moderately and is predictable for backfill and bedding",
    },
    adjustmentFactors: [
      {
        condition: "ideal",
        label: "Ideal Conditions",
        description: "Trench backfill, pipe bedding, controlled depth",
        adjustmentPercent: 5,
        reasoning: "Sand is easy to level and compacts predictably with equipment",
      },
      {
        condition: "heavy-compaction",
        label: "Heavy Compaction Required",
        description: "Under slabs, pavers, or structural applications",
        adjustmentPercent: 12,
        reasoning: "Compaction reduces sand volume — vibrating or tamping is common",
      },
      {
        condition: "hand-spreading",
        label: "Hand Spreading",
        description: "Small areas or tight access without equipment",
        adjustmentPercent: 8,
        reasoning: "Hand compaction is less thorough than machine compaction",
      },
    ],
    depthConsiderations: [
      "Pipe bedding: 4-6 inches under and around pipe",
      "Paver leveling: 1-2 inches screeded smooth",
      "Trench backfill: Varies by trench depth and width",
      "Under concrete slabs: 4-6 inches compacted is typical",
    ],
    commonMistakes: [
      "Not compacting sand properly — leads to settling",
      "Using sand as structural base instead of gravel",
      "Ordering by volume without accounting for compaction loss",
      "Spreading sand too thick without intermediate compaction",
    ],
    tips: [
      "Compact sand in 4-6 inch lifts, not all at once",
      "Add 10-12% extra for mechanical compaction projects",
      "Sand is easier to level than gravel — good for precise grading",
      "Keep sand dry if possible — wet sand is very heavy and hard to work",
    ],
  },
  {
    materialSlug: "asphalt-millings",
    category: "asphalt-millings",
    baseCompactionFactor: 0.12,
    confidenceRange: {
      low: 8,
      typical: 12,
      high: 15,
      description: "Asphalt millings compact and bind together — economical for driveways",
    },
    adjustmentFactors: [
      {
        condition: "ideal",
        label: "Ideal Conditions",
        description: "Rural driveway, parking area, firm base",
        adjustmentPercent: 10,
        reasoning: "Millings compact well and bind with heat — slight overage for edges",
      },
      {
        condition: "soft-ground",
        label: "Soft Ground",
        description: "Muddy base or weak subgrade",
        adjustmentPercent: 15,
        reasoning: "Soft ground requires more depth and millings for a stable surface",
      },
      {
        condition: "equipment-spreading",
        label: "Equipment Compaction",
        description: "Roller or heavy equipment for compaction",
        adjustmentPercent: 12,
        reasoning: "Equipment compaction maximizes binding and reduces final volume",
      },
    ],
    depthConsiderations: [
      "Light residential drive: 3-4 inches compacted",
      "Heavy use or commercial: 4-6 inches or more",
      "Over firm base: 3 inches may be sufficient",
      "Over soft ground: 6+ inches often needed",
    ],
    commonMistakes: [
      "Not compacting millings properly — they need weight and heat to bind",
      "Expecting millings to look like fresh asphalt — they are recycled",
      "Spreading too thin — less than 3 inches often fails",
      "Not planning for gradual binding over the first season",
    ],
    tips: [
      "Millings bind best in warm weather with heavy compaction",
      "Add 10-15% extra for compaction loss and irregular edges",
      "Let traffic compact millings naturally over time",
      "Millings are budget-friendly but not a premium finish",
    ],
  },
  {
    materialSlug: "304-limestone",
    category: "limestone",
    baseCompactionFactor: 0.15,
    confidenceRange: {
      low: 5,
      typical: 10,
      high: 15,
      description: "Crushed limestone compacts very tightly — premium stable base material",
    },
    adjustmentFactors: [
      {
        condition: "ideal",
        label: "Ideal Conditions",
        description: "Driveway base, paver base, controlled area",
        adjustmentPercent: 5,
        reasoning: "Limestone is a premium material that compacts predictably",
      },
      {
        condition: "irregular-area",
        label: "Irregular Area",
        description: "Curved drives, decorative borders",
        adjustmentPercent: 10,
        reasoning: "Irregular areas need extra material for clean finished edges",
      },
      {
        condition: "heavy-compaction",
        label: "Heavy Compaction",
        description: "Commercial drives, heavy equipment access",
        adjustmentPercent: 12,
        reasoning: "Heavy compaction for maximum stability reduces final volume",
      },
    ],
    depthConsiderations: [
      "Driveway base: 4-6 inches compacted",
      "Paver base: 4-6 inches plus 1 inch leveling layer",
      "Parking areas: 6-8 inches for heavy vehicles",
      "Decorative finish: 2-3 inches over firm base",
    ],
    commonMistakes: [
      "Not accounting for 10-15% compaction loss",
      "Spreading too thin for structural applications",
      "Forgetting that bright limestone shows tire marks and stains",
      "Ordering by area without confirming proper base depth",
    ],
    tips: [
      "Limestone is a premium product — budget accordingly",
      "Add 10% for compaction and irregular areas",
      "Bright color is beautiful but shows dirt — plan for maintenance",
      "Excellent for driveways where appearance and stability both matter",
    ],
  },
  {
    materialSlug: "57-limestone",
    category: "limestone",
    baseCompactionFactor: 0.08,
    confidenceRange: {
      low: 5,
      typical: 8,
      high: 10,
      description: "Washed limestone is a decorative finish stone with minimal compaction",
    },
    adjustmentFactors: [
      {
        condition: "ideal",
        label: "Ideal Conditions",
        description: "Decorative landscaping, pathways, borders",
        adjustmentPercent: 5,
        reasoning: "Clean limestone spreads easily with minimal waste",
      },
      {
        condition: "irregular-area",
        label: "Irregular Garden Beds",
        description: "Curved borders, around trees, decorative features",
        adjustmentPercent: 10,
        reasoning: "Irregular decorative areas are hard to measure precisely",
      },
    ],
    depthConsiderations: [
      "Decorative landscaping: 2-3 inches",
      "Pathways: 2-4 inches for walking comfort",
      "Ground cover: 2-3 inches to suppress weeds",
      "Not a structural base material",
    ],
    commonMistakes: [
      "Using decorative limestone as a load-bearing base",
      "Ordering too little for irregular garden beds",
      "Not planning for weed barrier fabric underneath",
      "Expecting limestone to stay bright white — it weathers naturally",
    ],
    tips: [
      "Bright premium finish — budget for the aesthetic",
      "Add 5-10% for irregular areas and clean edges",
      "Use landscape fabric to reduce weed growth",
      "Excellent for modern, clean landscape designs",
    ],
  },
];

export const RIGHT_SIZING_RULES: RightSizingRule[] = [
  {
    id: "rule-1",
    title: "Account for Compaction Loss",
    description: "All materials lose volume when compacted. Dense-graded and soil-based materials lose the most (15-30%), while washed stone and finished aggregates lose less (5-10%).",
    appliesTo: ["gravel", "crushed-stone", "limestone", "sand", "soil", "fill"],
    recommendedAdjustment: 15,
    priority: 1,
  },
  {
    id: "rule-2",
    title: "Add Extra for Irregular Areas",
    description: "Curved driveways, garden beds with irregular borders, and areas with varying width are difficult to measure precisely. Add 5-10% cushion for clean edges and transitions.",
    appliesTo: ["gravel", "crushed-stone", "limestone", "sand", "soil"],
    recommendedAdjustment: 10,
    priority: 2,
  },
  {
    id: "rule-3",
    title: "Plan for Soft or Muddy Ground",
    description: "Weak subgrade, soft spots, and muddy areas absorb material unpredictably. Soft ground often requires 1.5-2x the normal depth, meaning 50-100% more material than a firm base.",
    appliesTo: ["gravel", "crushed-stone", "fill", "asphalt-millings"],
    recommendedAdjustment: 50,
    priority: 1,
  },
  {
    id: "rule-4",
    title: "Depth Matters More Than Area",
    description: "A 1,000 sq ft driveway at 2 inches uses half the material of the same driveway at 4 inches. Verify depth requirements before ordering — many projects fail by spreading material too thin.",
    appliesTo: ["gravel", "crushed-stone", "limestone", "sand", "soil", "asphalt-millings", "fill"],
    recommendedAdjustment: 0,
    priority: 1,
  },
  {
    id: "rule-5",
    title: "Hand Spreading Increases Waste",
    description: "Manual spreading with rakes and shovels is less precise than machine grading. Add 5-10% extra for hand-spread projects to account for uneven distribution and touch-up needs.",
    appliesTo: ["gravel", "crushed-stone", "limestone", "sand", "soil"],
    recommendedAdjustment: 8,
    priority: 3,
  },
  {
    id: "rule-6",
    title: "Heavy Compaction Reduces Volume",
    description: "Projects requiring heavy compaction (commercial drives, heavy equipment areas, structural bases) lose more volume than light residential work. Plan for 10-15% extra on top of base compaction loss.",
    appliesTo: ["gravel", "crushed-stone", "limestone", "sand", "fill"],
    recommendedAdjustment: 15,
    priority: 2,
  },
  {
    id: "rule-7",
    title: "Order in Phases if Uncertain",
    description: "When project scope is unclear, ground conditions are unknown, or measurements are rough, order conservatively and plan for a second load. Easier to add material than remove excess.",
    appliesTo: ["gravel", "crushed-stone", "limestone", "sand", "soil", "asphalt-millings", "fill"],
    recommendedAdjustment: 0,
    priority: 3,
  },
  {
    id: "rule-8",
    title: "Topsoil Always Settles",
    description: "Topsoil contains organic matter and settles significantly over the first season. Always add 20-30% extra for settling, low spots, and long-term maintenance.",
    appliesTo: ["soil"],
    recommendedAdjustment: 25,
    priority: 1,
  },
  {
    id: "rule-9",
    title: "Drainage Depth is Non-Negotiable",
    description: "French drains, foundation drainage, and yard drainage require proper depth to function. Skimping on depth or material compromises performance — follow recommended depths closely.",
    appliesTo: ["gravel"],
    recommendedAdjustment: 5,
    priority: 1,
  },
  {
    id: "rule-10",
    title: "Decorative Stone Needs Less Cushion",
    description: "Washed decorative stone for landscaping, pathways, and borders settles less than structural base materials. A 5% cushion is usually sufficient for irregular garden beds.",
    appliesTo: ["limestone"],
    recommendedAdjustment: 5,
    priority: 3,
  },
];

/**
 * Helper function to get material-specific guidance by slug
 */
export function getMaterialGuidance(materialSlug: string): MaterialGuidance | undefined {
  return MATERIAL_GUIDANCE.find((guidance) => guidance.materialSlug === materialSlug);
}

/**
 * Helper function to get right-sizing rules that apply to a material category
 */
export function getRulesForCategory(category: MaterialCategory): RightSizingRule[] {
  return RIGHT_SIZING_RULES.filter((rule) => rule.appliesTo.includes(category)).sort(
    (a, b) => a.priority - b.priority
  );
}

/**
 * Helper function to calculate recommended adjustment percentage based on conditions
 */
export function calculateAdjustment(
  materialSlug: string,
  conditions: ProjectCondition[]
): number {
  const guidance = getMaterialGuidance(materialSlug);
  if (!guidance) {
    return 10; // Default 10% cushion if guidance not found
  }

  let totalAdjustment = guidance.baseCompactionFactor * 100;

  conditions.forEach((condition) => {
    const factor = guidance.adjustmentFactors.find((f) => f.condition === condition);
    if (factor) {
      totalAdjustment += factor.adjustmentPercent;
    }
  });

  return Math.round(totalAdjustment);
}

/**
 * Helper function to get confidence range description for a material
 */
export function getConfidenceRange(materialSlug: string): string {
  const guidance = getMaterialGuidance(materialSlug);
  return guidance?.confidenceRange.description || "Add 5-15% for typical projects";
}
