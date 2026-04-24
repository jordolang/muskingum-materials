/**
 * Loyalty Program Utility Functions
 *
 * Provides tier calculation, point management, and benefit determination
 * for the customer loyalty rewards program.
 */

// Tier type definition
export type Tier = "bronze" | "silver" | "gold";

// Constants
export const POINTS_PER_DOLLAR = 1; // 1 point earned per $1 spent
export const POINTS_TO_DOLLARS_RATIO = 100 / 5; // 100 points = $5 discount (20 points per $1)

// Tier thresholds (annual spending)
export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 5000, // $5,000+ annual spend
  gold: 15000,  // $15,000+ annual spend
} as const;

// Minimum points for redemption
export const MIN_REDEMPTION_POINTS = 100;

// Interface for tier benefits
export interface TierBenefits {
  tier: Tier;
  pointsMultiplier: number;
  freeDeliveryThreshold: number | null;
  priorityScheduling: boolean;
  exclusiveOffers: boolean;
  displayName: string;
  description: string;
}

/**
 * Calculates the appropriate tier based on annual spending amount.
 *
 * Tier levels:
 * - Bronze: Default tier for all customers
 * - Silver: $5,000+ in annual spending
 * - Gold: $15,000+ in annual spending
 *
 * @param annualSpend - Total amount spent in the current year
 * @returns The calculated tier level
 */
export function calculateTier(annualSpend: number): Tier {
  if (annualSpend >= TIER_THRESHOLDS.gold) {
    return "gold";
  }
  if (annualSpend >= TIER_THRESHOLDS.silver) {
    return "silver";
  }
  return "bronze";
}

/**
 * Returns the benefits associated with a specific tier level.
 *
 * Benefits include:
 * - Points multiplier for earning
 * - Free delivery threshold
 * - Priority scheduling access
 * - Exclusive offers
 *
 * @param tier - The tier level to get benefits for
 * @returns Benefits object for the specified tier
 */
export function getTierBenefits(tier: Tier): TierBenefits {
  switch (tier) {
    case "gold":
      return {
        tier: "gold",
        pointsMultiplier: 1,
        freeDeliveryThreshold: 500, // Free delivery on orders $500+
        priorityScheduling: true,
        exclusiveOffers: true,
        displayName: "Gold",
        description: "Our premium tier with maximum benefits",
      };
    case "silver":
      return {
        tier: "silver",
        pointsMultiplier: 1,
        freeDeliveryThreshold: 1000, // Free delivery on orders $1,000+
        priorityScheduling: true,
        exclusiveOffers: false,
        displayName: "Silver",
        description: "Enhanced benefits for loyal customers",
      };
    case "bronze":
    default:
      return {
        tier: "bronze",
        pointsMultiplier: 1,
        freeDeliveryThreshold: null, // No free delivery threshold
        priorityScheduling: false,
        exclusiveOffers: false,
        displayName: "Bronze",
        description: "Standard rewards program membership",
      };
  }
}

/**
 * Calculates loyalty points earned for a dollar amount.
 *
 * Standard rate: 1 point per $1 spent
 * Future enhancement: Could apply tier multipliers
 *
 * @param dollars - Dollar amount to convert to points
 * @returns Number of points earned (rounded down to nearest integer)
 */
export function calculatePointsForAmount(dollars: number): number {
  if (dollars < 0) {
    throw new Error("Dollar amount cannot be negative");
  }
  return Math.floor(dollars * POINTS_PER_DOLLAR);
}

/**
 * Calculates discount dollar amount for a number of points.
 *
 * Conversion rate: 100 points = $5 off
 *
 * @param points - Number of points to redeem
 * @returns Dollar discount amount
 * @throws Error if points amount is invalid
 */
export function calculateDiscountForPoints(points: number): number {
  if (points < 0) {
    throw new Error("Points amount cannot be negative");
  }
  if (points % MIN_REDEMPTION_POINTS !== 0) {
    throw new Error(
      `Points must be redeemed in increments of ${MIN_REDEMPTION_POINTS}`
    );
  }
  return points / POINTS_TO_DOLLARS_RATIO;
}

/**
 * Validates if points amount is eligible for redemption.
 *
 * Points must be:
 * - At least MIN_REDEMPTION_POINTS (100)
 * - In multiples of MIN_REDEMPTION_POINTS
 *
 * @param points - Number of points to validate
 * @returns True if points can be redeemed, false otherwise
 */
export function canRedeemPoints(points: number): boolean {
  return (
    points >= MIN_REDEMPTION_POINTS &&
    points % MIN_REDEMPTION_POINTS === 0
  );
}

/**
 * Calculates progress towards the next tier.
 *
 * @param currentSpend - Current annual spending
 * @param currentTier - Current tier level
 * @returns Object with next tier, amount needed, and progress percentage
 */
export function calculateTierProgress(
  currentSpend: number,
  currentTier: Tier
): {
  nextTier: Tier | null;
  amountNeeded: number;
  progressPercentage: number;
} {
  let nextTier: Tier | null = null;
  let nextThreshold = 0;
  let currentThreshold = 0;

  switch (currentTier) {
    case "bronze":
      nextTier = "silver";
      nextThreshold = TIER_THRESHOLDS.silver;
      currentThreshold = TIER_THRESHOLDS.bronze;
      break;
    case "silver":
      nextTier = "gold";
      nextThreshold = TIER_THRESHOLDS.gold;
      currentThreshold = TIER_THRESHOLDS.silver;
      break;
    case "gold":
      // Already at max tier
      return {
        nextTier: null,
        amountNeeded: 0,
        progressPercentage: 100,
      };
  }

  const amountNeeded = Math.max(0, nextThreshold - currentSpend);
  const progress = currentSpend - currentThreshold;
  const totalNeeded = nextThreshold - currentThreshold;
  const progressPercentage = Math.min(
    100,
    Math.max(0, (progress / totalNeeded) * 100)
  );

  return {
    nextTier,
    amountNeeded,
    progressPercentage,
  };
}
