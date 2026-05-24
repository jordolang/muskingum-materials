interface PricingTier {
  minQuantity: number;
  maxQuantity?: number;
  pricePerTon: number;
}

interface Product {
  name: string;
  pricePerTon: number;
  unit: string;
  pricingTiers?: PricingTier[];
}

interface PriceCalculationResult {
  basePrice: number;
  volumeDiscountedPrice: number;
  contractorPrice: number;
  finalPrice: number;
  appliedTier?: PricingTier;
  volumeDiscount: number;
  contractorDiscount: number;
  totalSavings: number;
}

/**
 * Calculates the appropriate price for a product based on quantity and contractor status.
 * Applies volume-based pricing tiers and contractor discounts.
 *
 * @param product - Product with pricing information
 * @param quantity - Quantity being ordered (in tons)
 * @param contractorDiscountPercent - Optional contractor discount percentage (0-100)
 * @returns Detailed price calculation with discounts applied
 */
export function calculatePrice(
  product: Product,
  quantity: number,
  contractorDiscountPercent?: number
): PriceCalculationResult {
  // Start with base price
  const basePrice = product.pricePerTon;

  // Find the appropriate pricing tier based on quantity
  let volumeDiscountedPrice = basePrice;
  let appliedTier: PricingTier | undefined;

  if (product.pricingTiers && product.pricingTiers.length > 0) {
    // Sort tiers by minQuantity descending to find the highest applicable tier
    const sortedTiers = [...product.pricingTiers].sort(
      (a, b) => b.minQuantity - a.minQuantity
    );

    // Find the first tier where quantity meets the minimum
    // and doesn't exceed the maximum (if specified)
    for (const tier of sortedTiers) {
      const meetsMinimum = quantity >= tier.minQuantity;
      const withinMaximum =
        tier.maxQuantity === undefined ||
        tier.maxQuantity === null ||
        quantity <= tier.maxQuantity;

      if (meetsMinimum && withinMaximum) {
        appliedTier = tier;
        volumeDiscountedPrice = tier.pricePerTon;
        break;
      }
    }
  }

  // Calculate volume discount amount
  const volumeDiscount = basePrice - volumeDiscountedPrice;

  // Apply contractor discount if applicable
  let contractorPrice = volumeDiscountedPrice;
  let contractorDiscount = 0;

  if (contractorDiscountPercent && contractorDiscountPercent > 0) {
    // Contractor discount applies to the volume-discounted price
    const discountMultiplier = contractorDiscountPercent / 100;
    contractorDiscount = volumeDiscountedPrice * discountMultiplier;
    contractorPrice = volumeDiscountedPrice - contractorDiscount;
  }

  // Final price is the contractor price (or volume-discounted price if not a contractor)
  const finalPrice = contractorPrice;

  // Total savings from base price
  const totalSavings = basePrice - finalPrice;

  return {
    basePrice,
    volumeDiscountedPrice,
    contractorPrice,
    finalPrice,
    appliedTier,
    volumeDiscount,
    contractorDiscount,
    totalSavings,
  };
}

/**
 * Validates that a claimed price matches the calculated price for a product.
 * Used for server-side validation to prevent price manipulation.
 *
 * @param product - Product with pricing information
 * @param quantity - Quantity being ordered
 * @param claimedPrice - Price claimed by the client
 * @param contractorDiscountPercent - Optional contractor discount percentage
 * @param tolerance - Acceptable difference for rounding (default: 0.01)
 * @returns True if price is valid, false otherwise
 */
export function validatePrice(
  product: Product,
  quantity: number,
  claimedPrice: number,
  contractorDiscountPercent?: number,
  tolerance: number = 0.01
): boolean {
  const calculation = calculatePrice(
    product,
    quantity,
    contractorDiscountPercent
  );

  return Math.abs(claimedPrice - calculation.finalPrice) <= tolerance;
}

/**
 * Gets the display price for a product, showing the starting price
 * or the price for a specific quantity.
 *
 * @param product - Product with pricing information
 * @param quantity - Optional quantity to calculate price for
 * @returns Price to display
 */
export function getDisplayPrice(product: Product, quantity?: number): number {
  if (!quantity || quantity <= 0) {
    // Return the lowest available price (either base or lowest tier)
    if (!product.pricingTiers || product.pricingTiers.length === 0) {
      return product.pricePerTon;
    }

    const lowestTierPrice = Math.min(
      ...product.pricingTiers.map((t) => t.pricePerTon)
    );
    return Math.min(product.pricePerTon, lowestTierPrice);
  }

  const calculation = calculatePrice(product, quantity);
  return calculation.finalPrice;
}

/**
 * Formats pricing tiers for display purposes.
 *
 * @param product - Product with pricing information
 * @returns Array of formatted tier strings
 */
export function formatPricingTiers(product: Product): string[] {
  const tiers: string[] = [];

  // Add base price tier
  tiers.push(`Standard: $${product.pricePerTon.toFixed(2)}/ton`);

  // Add volume tiers if available
  if (product.pricingTiers && product.pricingTiers.length > 0) {
    const sortedTiers = [...product.pricingTiers].sort(
      (a, b) => a.minQuantity - b.minQuantity
    );

    for (const tier of sortedTiers) {
      const range =
        tier.maxQuantity !== undefined && tier.maxQuantity !== null
          ? `${tier.minQuantity}-${tier.maxQuantity} tons`
          : `${tier.minQuantity}+ tons`;
      tiers.push(`${range}: $${tier.pricePerTon.toFixed(2)}/ton`);
    }
  }

  return tiers;
}
