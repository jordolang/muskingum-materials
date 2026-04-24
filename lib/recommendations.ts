import { prisma } from "@/lib/prisma";
import {
  PROJECT_TYPE_MAPPINGS,
  AREA_SIZE_RANGES,
  type ProjectType,
  type AreaSize,
  type ProductRecommendation,
  type ProjectTypeMapping,
} from "@/data/recommendation-mapping";

/**
 * Extended recommendation with product details and cost estimates
 */
export interface RecommendationWithDetails extends ProductRecommendation {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number | null;
    unit: string;
    imageUrl: string | null;
    imageAlt: string | null;
    shortDescription: string | null;
  } | null;
  estimatedQuantity: number;
  estimatedCost: number | null;
}

/**
 * Complete recommendation result for a project
 */
export interface ProjectRecommendationResult {
  projectType: ProjectTypeMapping;
  areaSize: AreaSize;
  areaSqFt: number;
  recommendations: RecommendationWithDetails[];
}

/**
 * Get recommendations for a specific project type
 */
export async function getRecommendationsByProjectType(
  projectType: ProjectType
): Promise<ProjectTypeMapping | null> {
  const mapping = PROJECT_TYPE_MAPPINGS.find((m) => m.type === projectType);
  return mapping || null;
}

/**
 * Get all available project types
 */
export function getAllProjectTypes(): ProjectTypeMapping[] {
  return [...PROJECT_TYPE_MAPPINGS];
}

/**
 * Calculate quantity needed based on area and product recommendation
 */
export function calculateQuantity(
  areaSqFt: number,
  recommendation: ProductRecommendation
): number {
  // If quantityFactor is provided, use area-based calculation
  if (recommendation.quantityFactor) {
    const calculated = areaSqFt * recommendation.quantityFactor;

    // Apply minimum quantity if specified
    if (recommendation.minQuantity && calculated < recommendation.minQuantity) {
      return recommendation.minQuantity;
    }

    // Round up to nearest 0.5 tons for practical ordering
    return Math.ceil(calculated * 2) / 2;
  }

  // If no quantityFactor, use minimum quantity or default to 1 ton
  return recommendation.minQuantity || 1;
}

/**
 * Estimate cost for a recommendation
 */
export function estimateCost(
  quantity: number,
  productPrice: number | null
): number | null {
  if (!productPrice) {
    return null;
  }

  return quantity * productPrice;
}

/**
 * Get area square footage from area size selection
 */
export function getAreaSqFt(areaSize: AreaSize): number {
  const sizeRange = AREA_SIZE_RANGES[areaSize];
  return sizeRange.typicalSqFt;
}

/**
 * Get complete recommendations with product details and cost estimates
 */
export async function getCompleteRecommendations(
  projectType: ProjectType,
  areaSize: AreaSize
): Promise<ProjectRecommendationResult | null> {
  // Get project type mapping
  const projectMapping = await getRecommendationsByProjectType(projectType);
  if (!projectMapping) {
    return null;
  }

  // Calculate area in square feet
  const areaSqFt = getAreaSqFt(areaSize);

  // Get all product slugs from recommendations
  const productSlugs = projectMapping.recommendations.map((r) => r.productSlug);

  // Fetch product details from database
  const products = await prisma.product.findMany({
    where: {
      slug: { in: productSlugs },
      active: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      unit: true,
      imageUrl: true,
      imageAlt: true,
      shortDescription: true,
    },
  });

  // Create a map for quick product lookup
  const productMap = new Map(products.map((p) => [p.slug, p]));

  // Build recommendations with details
  const recommendationsWithDetails: RecommendationWithDetails[] =
    projectMapping.recommendations.map((rec) => {
      const product = productMap.get(rec.productSlug) || null;
      const estimatedQuantity = calculateQuantity(areaSqFt, rec);
      const estimatedCost = estimateCost(estimatedQuantity, product?.price || null);

      return {
        ...rec,
        product,
        estimatedQuantity,
        estimatedCost,
      };
    });

  return {
    projectType: projectMapping,
    areaSize,
    areaSqFt,
    recommendations: recommendationsWithDetails,
  };
}

/**
 * Get top N recommendations (by priority) with details
 */
export async function getTopRecommendations(
  projectType: ProjectType,
  areaSize: AreaSize,
  limit: number = 3
): Promise<RecommendationWithDetails[]> {
  const result = await getCompleteRecommendations(projectType, areaSize);

  if (!result) {
    return [];
  }

  // Sort by priority (lower number = higher priority) and take top N
  return result.recommendations
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit);
}

/**
 * Get single best recommendation for a project type and area
 */
export async function getBestRecommendation(
  projectType: ProjectType,
  areaSize: AreaSize
): Promise<RecommendationWithDetails | null> {
  const recommendations = await getTopRecommendations(projectType, areaSize, 1);
  return recommendations[0] || null;
}
