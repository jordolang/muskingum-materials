/**
 * Estimate Calculation Utilities
 *
 * This module provides confidence range calculations for project material estimates.
 * It accounts for two primary sources of variance:
 * 1. Material density variation (different materials have different densities)
 * 2. Depth measurement variance (±0.5 inches typical field measurement uncertainty)
 *
 * These calculations help customers understand the realistic range of material needed
 * rather than presenting a single "precise" number that may be misleading.
 */

import {
  MATERIAL_DENSITY_AVG,
  TRUCK_CAPACITY_TONS,
} from "@/lib/constants/business-rules";

/**
 * Default density variance when product-specific density data is unavailable
 *
 * This ±0.1 tons/yd³ range represents typical variation in aggregate materials
 * and provides a conservative confidence range even when exact product density
 * data hasn't been measured or entered.
 *
 * Applied to MATERIAL_DENSITY_AVG (1.4 tons/yd³):
 * - Low: 1.3 tons/yd³
 * - High: 1.5 tons/yd³
 */
const DEFAULT_DENSITY_VARIANCE = 0.1;

/**
 * Depth measurement variance (±0.5 inches)
 *
 * Field measurements of desired depth are rarely exact. This variance accounts for:
 * - Measurement tool precision limits
 * - Ground surface irregularities
 * - Compaction differences
 * - Human measurement error
 *
 * A ±0.5 inch variance is industry-standard for residential/light commercial projects.
 */
const DEPTH_VARIANCE_INCHES = 0.5;

/**
 * Result structure for estimate calculations with confidence ranges
 */
export interface EstimateResult {
  // Legacy single-value fields (for backward compatibility)
  cubicFeet: number;
  cubicYards: number;
  tons: number;
  truckloads: number;

  // Confidence range fields
  cubicYardsLow?: number;
  cubicYardsExpected?: number;
  cubicYardsHigh?: number;
  tonsLow?: number;
  tonsExpected?: number;
  tonsHigh?: number;
  truckloadsLow?: number;
  truckloadsExpected?: number;
  truckloadsHigh?: number;
  depthVariance?: number;
  confidenceFactors?: {
    densityVariation: boolean;
    depthMeasurementVariance: boolean;
    materialType?: string;
  };
  source: "map" | "dimensions";
}

/**
 * Density range parameters for confidence calculations
 */
export interface DensityRange {
  /** Lower bound of material density (tons per cubic yard) */
  low: number;
  /** Average/expected material density (tons per cubic yard) */
  avg: number;
  /** Upper bound of material density (tons per cubic yard) */
  high: number;
}

/**
 * Calculate material estimate with confidence range
 *
 * This is the primary estimation function that accounts for real-world variance
 * in both material density and depth measurements to provide a realistic range
 * rather than a misleadingly precise single value.
 *
 * @param areaSqFt - Project area in square feet
 * @param depthInches - Desired material depth in inches
 * @param densityRange - Material density range (optional, uses default if missing)
 * @param materialType - Material type name for metadata (optional)
 * @param source - Source of area measurement ("map" or "dimensions")
 * @returns Complete estimate with low/expected/high ranges
 *
 * @example
 * ```typescript
 * // With product-specific density data
 * const estimate = calculateConfidenceRange(1000, 4, {
 *   low: 1.3,
 *   avg: 1.4,
 *   high: 1.6
 * }, "Pea Gravel", "map");
 *
 * console.log(estimate.tonsLow);      // Conservative estimate
 * console.log(estimate.tonsExpected); // Most likely amount
 * console.log(estimate.tonsHigh);     // Upper bound
 *
 * // Without density data (graceful fallback)
 * const estimateFallback = calculateConfidenceRange(1000, 4);
 * // Uses MATERIAL_DENSITY_AVG ± DEFAULT_DENSITY_VARIANCE
 * ```
 */
export function calculateConfidenceRange(
  areaSqFt: number,
  depthInches: number,
  densityRange?: Partial<DensityRange>,
  materialType?: string,
  source: "map" | "dimensions" = "map"
): EstimateResult {
  // Determine density values with graceful fallback
  const hasDensityData =
    densityRange?.low !== undefined && densityRange?.high !== undefined;

  const densityLow = hasDensityData
    ? densityRange.low!
    : MATERIAL_DENSITY_AVG - DEFAULT_DENSITY_VARIANCE;

  const densityAvg =
    densityRange?.avg ?? densityRange?.low ?? densityRange?.high ?? MATERIAL_DENSITY_AVG;

  const densityHigh = hasDensityData
    ? densityRange.high!
    : MATERIAL_DENSITY_AVG + DEFAULT_DENSITY_VARIANCE;

  // Calculate depth variants (±0.5 inches)
  const depthLow = Math.max(0.5, depthInches - DEPTH_VARIANCE_INCHES);
  const depthExpected = depthInches;
  const depthHigh = depthInches + DEPTH_VARIANCE_INCHES;

  // Low estimate: minimum density × minimum depth
  const cubicFeetLow = areaSqFt * (depthLow / 12);
  const cubicYardsLow = cubicFeetLow / 27;
  const tonsLow = cubicYardsLow * densityLow;
  const truckloadsLow = Math.max(1, Math.ceil(tonsLow / TRUCK_CAPACITY_TONS));

  // Expected estimate: average density × nominal depth
  const cubicFeetExpected = areaSqFt * (depthExpected / 12);
  const cubicYardsExpected = cubicFeetExpected / 27;
  const tonsExpected = cubicYardsExpected * densityAvg;
  const truckloadsExpected = Math.max(
    1,
    Math.ceil(tonsExpected / TRUCK_CAPACITY_TONS)
  );

  // High estimate: maximum density × maximum depth
  const cubicFeetHigh = areaSqFt * (depthHigh / 12);
  const cubicYardsHigh = cubicFeetHigh / 27;
  const tonsHigh = cubicYardsHigh * densityHigh;
  const truckloadsHigh = Math.max(1, Math.ceil(tonsHigh / TRUCK_CAPACITY_TONS));

  // Build confidence factors metadata
  const confidenceFactors = {
    densityVariation: hasDensityData,
    depthMeasurementVariance: true,
    ...(materialType && { materialType }),
  };

  return {
    // Legacy single-value fields (use expected values for backward compatibility)
    cubicFeet: cubicFeetExpected,
    cubicYards: cubicYardsExpected,
    tons: tonsExpected,
    truckloads: truckloadsExpected,

    // Confidence range fields
    cubicYardsLow,
    cubicYardsExpected,
    cubicYardsHigh,
    tonsLow,
    tonsExpected,
    tonsHigh,
    truckloadsLow,
    truckloadsExpected,
    truckloadsHigh,
    depthVariance: DEPTH_VARIANCE_INCHES,
    confidenceFactors,
    source,
  };
}

/**
 * Calculate estimate from rectangular dimensions with confidence range
 *
 * Convenience wrapper for rectangular areas (length × width).
 *
 * @param lengthFt - Rectangle length in feet
 * @param widthFt - Rectangle width in feet
 * @param depthInches - Desired material depth in inches
 * @param densityRange - Material density range (optional)
 * @param materialType - Material type name for metadata (optional)
 * @returns Complete estimate with low/expected/high ranges
 */
export function calculateFromDimensions(
  lengthFt: number,
  widthFt: number,
  depthInches: number,
  densityRange?: Partial<DensityRange>,
  materialType?: string
): EstimateResult {
  return calculateConfidenceRange(
    lengthFt * widthFt,
    depthInches,
    densityRange,
    materialType,
    "dimensions"
  );
}

/**
 * Calculate estimate from area measurement with confidence range
 *
 * Convenience wrapper for area-based calculations (e.g., from satellite polygon).
 *
 * @param areaSqFt - Project area in square feet
 * @param depthInches - Desired material depth in inches
 * @param densityRange - Material density range (optional)
 * @param materialType - Material type name for metadata (optional)
 * @returns Complete estimate with low/expected/high ranges
 */
export function calculateFromArea(
  areaSqFt: number,
  depthInches: number,
  densityRange?: Partial<DensityRange>,
  materialType?: string
): EstimateResult {
  return calculateConfidenceRange(
    areaSqFt,
    depthInches,
    densityRange,
    materialType,
    "map"
  );
}

/**
 * Validation utilities
 */

/**
 * Validates that a density range is physically reasonable
 * @param range - Density range to validate
 * @returns True if range is valid
 * @public Can be used to validate product density data
 */
export function isValidDensityRange(range: Partial<DensityRange>): boolean {
  if (!range.low && !range.avg && !range.high) {
    return true; // Empty range is valid (will use defaults)
  }

  // If any value is provided, it must be physically reasonable
  if (range.low !== undefined && (range.low < 0.5 || range.low > 2.5)) {
    return false;
  }
  if (range.avg !== undefined && (range.avg < 0.5 || range.avg > 2.5)) {
    return false;
  }
  if (range.high !== undefined && (range.high < 0.5 || range.high > 2.5)) {
    return false;
  }

  // If multiple values provided, they must be ordered correctly
  if (range.low !== undefined && range.avg !== undefined && range.low > range.avg) {
    return false;
  }
  if (range.avg !== undefined && range.high !== undefined && range.avg > range.high) {
    return false;
  }
  if (range.low !== undefined && range.high !== undefined && range.low > range.high) {
    return false;
  }

  return true;
}

/**
 * Validates that area is positive and reasonable
 * @param areaSqFt - Area in square feet
 * @returns True if area is valid
 * @public Can be used to validate user input
 */
export function isValidArea(areaSqFt: number): boolean {
  // Reasonable bounds: 1 sqft (tiny) to 1 million sqft (large commercial)
  return areaSqFt > 0 && areaSqFt <= 1_000_000;
}

/**
 * Validates that depth is positive and reasonable
 * @param depthInches - Depth in inches
 * @returns True if depth is valid
 * @public Can be used to validate user input
 */
export function isValidDepth(depthInches: number): boolean {
  // Reasonable bounds: 0.5 inches (thin) to 24 inches (deep base)
  return depthInches >= 0.5 && depthInches <= 24;
}
