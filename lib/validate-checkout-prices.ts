import { sanityClient } from "@/lib/sanity/client";
import { productsQuery } from "@/lib/sanity/queries";
import { BUSINESS_INFO } from "@/data/business";
import { prisma } from "@/lib/prisma";
import { calculatePrice } from "@/lib/pricing-calculator";

interface CheckoutItem {
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

interface CheckoutData {
  items: CheckoutItem[];
  subtotal: number;
  tax: number;
  processingFee: number;
  total: number;
}

interface ValidatedPrices {
  subtotal: number;
  tax: number;
  processingFee: number;
  total: number;
}

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

async function loadCatalogFromPrisma(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { active: true },
    select: { name: true, price: true, unit: true },
  });
  return rows.map((r) => ({
    name: r.name,
    pricePerTon: r.price ?? 0,
    unit: r.unit,
  }));
}

/**
 * Validates checkout prices against product catalog and recalculates totals.
 * Sanity (marketing) is preferred when populated; otherwise the Prisma catalog
 * is the source of truth.
 *
 * @param data - Checkout data with items and claimed prices
 * @param contractorDiscountPercent - Optional contractor discount percentage (0-100)
 * @returns Validated and recalculated prices
 * @throws Error if prices don't match catalog or calculations are incorrect
 */
export async function validateCheckoutPrices(
  data: CheckoutData,
  contractorDiscountPercent?: number
): Promise<ValidatedPrices> {
  let products: Product[];
  try {
    const sanityProducts = await sanityClient.fetch<Product[]>(productsQuery);
    if (sanityProducts && sanityProducts.length > 0) {
      products = sanityProducts;
    } else {
      products = await loadCatalogFromPrisma();
    }
  } catch {
    products = await loadCatalogFromPrisma();
  }

  // Create a lookup map for quick price validation
  const productMap = new Map<string, Product>();
  for (const product of products) {
    productMap.set(product.name.toLowerCase(), product);
  }

  // Validate each item's price against catalog
  for (const item of data.items) {
    const catalogProduct = productMap.get(item.name.toLowerCase());

    if (!catalogProduct) {
      throw new Error(`Product "${item.name}" not found in catalog`);
    }

    // Reject "call" pricing items — they have no catalog price and require
    // a quote, so client-supplied prices cannot be validated.
    if (catalogProduct.unit === "call") {
      throw new Error(
        `Product "${item.name}" requires a custom quote (call for pricing) and cannot be purchased online`
      );
    }

    // Calculate the correct price based on quantity and volume tiers
    const priceCalculation = calculatePrice(
      catalogProduct,
      item.quantity,
      contractorDiscountPercent
    );
    const expectedPrice = priceCalculation.finalPrice;
    const tolerance = 0.01; // Allow 1 cent tolerance for rounding

    if (Math.abs(item.price - expectedPrice) > tolerance) {
      throw new Error(
        `Price mismatch for "${item.name}": expected $${expectedPrice.toFixed(2)}, received $${item.price.toFixed(2)}`
      );
    }

    // Validate unit matches catalog
    if (item.unit !== catalogProduct.unit) {
      throw new Error(
        `Unit mismatch for "${item.name}": expected "${catalogProduct.unit}", received "${item.unit}"`
      );
    }
  }

  // Recalculate subtotal
  const calculatedSubtotal = data.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Recalculate tax (7.25% of subtotal)
  const calculatedTax = calculatedSubtotal * BUSINESS_INFO.taxRate;

  // Recalculate processing fee (4.5% of subtotal + tax)
  const calculatedProcessingFee =
    (calculatedSubtotal + calculatedTax) * BUSINESS_INFO.creditProcessingFee;

  // Recalculate total
  const calculatedTotal =
    calculatedSubtotal + calculatedTax + calculatedProcessingFee;

  // Validate claimed totals match calculated totals (with small tolerance for rounding)
  const tolerance = 0.02; // 2 cent tolerance for cumulative rounding

  if (Math.abs(data.subtotal - calculatedSubtotal) > tolerance) {
    throw new Error(
      `Subtotal mismatch: expected $${calculatedSubtotal.toFixed(2)}, received $${data.subtotal.toFixed(2)}`
    );
  }

  if (Math.abs(data.tax - calculatedTax) > tolerance) {
    throw new Error(
      `Tax mismatch: expected $${calculatedTax.toFixed(2)}, received $${data.tax.toFixed(2)}`
    );
  }

  if (Math.abs(data.processingFee - calculatedProcessingFee) > tolerance) {
    throw new Error(
      `Processing fee mismatch: expected $${calculatedProcessingFee.toFixed(2)}, received $${data.processingFee.toFixed(2)}`
    );
  }

  if (Math.abs(data.total - calculatedTotal) > tolerance) {
    throw new Error(
      `Total mismatch: expected $${calculatedTotal.toFixed(2)}, received $${data.total.toFixed(2)}`
    );
  }

  // Return validated prices (use server-calculated values)
  return {
    subtotal: calculatedSubtotal,
    tax: calculatedTax,
    processingFee: calculatedProcessingFee,
    total: calculatedTotal,
  };
}
