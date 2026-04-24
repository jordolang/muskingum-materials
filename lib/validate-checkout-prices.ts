import { sanityClient } from "@/lib/sanity/client";
import { productsQuery } from "@/lib/sanity/queries";
import { BUSINESS_INFO, PRODUCTS } from "@/data/business";

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

interface Product {
  name: string;
  pricePerTon: number;
  unit: string;
}

/**
 * Validates checkout prices against product catalog and recalculates totals.
 * Fetches products from Sanity with fallback to hardcoded data.
 *
 * @param data - Checkout data with items and claimed prices
 * @returns Validated and recalculated prices
 * @throws Error if prices don't match catalog or calculations are incorrect
 */
export async function validateCheckoutPrices(
  data: CheckoutData
): Promise<ValidatedPrices> {
  // Fetch products from Sanity, fallback to hardcoded PRODUCTS
  let products: Product[];
  try {
    const sanityProducts = await sanityClient.fetch<Product[]>(productsQuery);
    if (sanityProducts && sanityProducts.length > 0) {
      products = sanityProducts;
    } else {
      // Fallback to hardcoded products
      products = PRODUCTS.map((p) => ({
        name: p.name,
        pricePerTon: p.price,
        unit: p.unit,
      }));
    }
  } catch {
    // Fallback to hardcoded products if Sanity fetch fails
    products = PRODUCTS.map((p) => ({
      name: p.name,
      pricePerTon: p.price,
      unit: p.unit,
    }));
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

    // Validate price matches catalog
    const catalogPrice = catalogProduct.pricePerTon;
    const tolerance = 0.01; // Allow 1 cent tolerance for rounding

    if (Math.abs(item.price - catalogPrice) > tolerance) {
      throw new Error(
        `Price mismatch for "${item.name}": expected $${catalogPrice.toFixed(2)}, received $${item.price.toFixed(2)}`
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
