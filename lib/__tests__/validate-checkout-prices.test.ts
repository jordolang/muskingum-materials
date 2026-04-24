import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateCheckoutPrices } from "@/lib/validate-checkout-prices";
import { sanityClient } from "@/lib/sanity/client";
import { BUSINESS_INFO } from "@/data/business";

vi.mock("@/lib/sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(),
  },
}));

describe("validateCheckoutPrices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful validation", () => {
    it("should validate correct prices from Sanity catalog", async () => {
      const mockProducts = [
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
        { name: "Fill Sand", pricePerTon: 4.0, unit: "ton" },
      ];

      vi.mocked(sanityClient.fetch).mockResolvedValue(mockProducts);

      const checkoutData = {
        items: [
          { name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 5 },
          { name: "Fill Sand", price: 4.0, unit: "ton", quantity: 3 },
        ],
        subtotal: 22.0, // (2 * 5) + (4 * 3) = 22
        tax: 1.595, // 22 * 0.0725 = 1.595
        processingFee: 1.062, // (22 + 1.595) * 0.045 = 1.06175
        total: 24.657, // 22 + 1.595 + 1.06175 = 24.65675
      };

      const result = await validateCheckoutPrices(checkoutData);

      expect(result.subtotal).toBeCloseTo(22.0, 2);
      expect(result.tax).toBeCloseTo(1.595, 2);
      expect(result.processingFee).toBeCloseTo(1.06175, 2);
      expect(result.total).toBeCloseTo(24.65675, 2);
    });

    it("should validate with case-insensitive product name matching", async () => {
      const mockProducts = [
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
      ];

      vi.mocked(sanityClient.fetch).mockResolvedValue(mockProducts);

      const checkoutData = {
        items: [{ name: "fill dirt", price: 2.0, unit: "ton", quantity: 1 }],
        subtotal: 2.0,
        tax: 0.145,
        processingFee: 0.096525,
        total: 2.241525,
      };

      const result = await validateCheckoutPrices(checkoutData);

      expect(result.subtotal).toBeCloseTo(2.0, 2);
    });

    it("should accept prices within tolerance (1 cent)", async () => {
      const mockProducts = [
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
      ];

      vi.mocked(sanityClient.fetch).mockResolvedValue(mockProducts);

      const checkoutData = {
        items: [
          { name: "Fill Dirt", price: 2.005, unit: "ton", quantity: 1 },
        ],
        subtotal: 2.005,
        tax: 0.145, // 2.005 * 0.0725 = 0.14536
        processingFee: 0.096, // (2.005 + 0.145) * 0.045 = 0.09675
        total: 2.246, // 2.005 + 0.145 + 0.096 = 2.246
      };

      const result = await validateCheckoutPrices(checkoutData);

      expect(result).toBeDefined();
    });
  });

  describe("fallback to hardcoded products", () => {
    it("should use hardcoded products when Sanity returns empty array", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([]);

      const checkoutData = {
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 1 }],
        subtotal: 2.0,
        tax: 0.145,
        processingFee: 0.096525,
        total: 2.241525,
      };

      const result = await validateCheckoutPrices(checkoutData);

      expect(result.subtotal).toBeCloseTo(2.0, 2);
    });

    it("should use hardcoded products when Sanity fetch fails", async () => {
      vi.mocked(sanityClient.fetch).mockRejectedValue(
        new Error("Sanity unavailable")
      );

      const checkoutData = {
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 1 }],
        subtotal: 2.0,
        tax: 0.145,
        processingFee: 0.096525,
        total: 2.241525,
      };

      const result = await validateCheckoutPrices(checkoutData);

      expect(result.subtotal).toBeCloseTo(2.0, 2);
    });

    it("should use hardcoded products when Sanity returns null", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue(null);

      const checkoutData = {
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 1 }],
        subtotal: 2.0,
        tax: 0.145,
        processingFee: 0.096525,
        total: 2.241525,
      };

      const result = await validateCheckoutPrices(checkoutData);

      expect(result.subtotal).toBeCloseTo(2.0, 2);
    });
  });

  describe("product validation errors", () => {
    it("should reject product not in catalog", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
      ]);

      const checkoutData = {
        items: [
          { name: "Unknown Product", price: 5.0, unit: "ton", quantity: 1 },
        ],
        subtotal: 5.0,
        tax: 0.36,
        processingFee: 0.24,
        total: 5.6,
      };

      await expect(validateCheckoutPrices(checkoutData)).rejects.toThrow(
        'Product "Unknown Product" not found in catalog'
      );
    });

    it("should reject 'call' pricing items", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([
        { name: "Sand (Washed)", pricePerTon: 0, unit: "call" },
      ]);

      const checkoutData = {
        items: [
          { name: "Sand (Washed)", price: 10.0, unit: "call", quantity: 1 },
        ],
        subtotal: 10.0,
        tax: 0.725,
        processingFee: 0.482625,
        total: 11.207625,
      };

      await expect(validateCheckoutPrices(checkoutData)).rejects.toThrow(
        'Product "Sand (Washed)" requires a custom quote (call for pricing) and cannot be purchased online'
      );
    });

    it("should reject price mismatch beyond tolerance", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
      ]);

      const checkoutData = {
        items: [
          { name: "Fill Dirt", price: 3.0, unit: "ton", quantity: 1 },
        ],
        subtotal: 3.0,
        tax: 0.22,
        processingFee: 0.14,
        total: 3.36,
      };

      await expect(validateCheckoutPrices(checkoutData)).rejects.toThrow(
        'Price mismatch for "Fill Dirt": expected $2.00, received $3.00'
      );
    });

    it("should reject unit mismatch", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
      ]);

      const checkoutData = {
        items: [
          { name: "Fill Dirt", price: 2.0, unit: "load", quantity: 1 },
        ],
        subtotal: 2.0,
        tax: 0.145,
        processingFee: 0.096525,
        total: 2.241525,
      };

      await expect(validateCheckoutPrices(checkoutData)).rejects.toThrow(
        'Unit mismatch for "Fill Dirt": expected "ton", received "load"'
      );
    });
  });

  describe("calculation validation errors", () => {
    it("should reject incorrect subtotal", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
      ]);

      const checkoutData = {
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 5 }],
        subtotal: 15.0, // Wrong! Should be 10.0
        tax: 1.0875,
        processingFee: 0.723375,
        total: 16.810875,
      };

      await expect(validateCheckoutPrices(checkoutData)).rejects.toThrow(
        "Subtotal mismatch: expected $10.00, received $15.00"
      );
    });

    it("should reject incorrect tax calculation", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
      ]);

      const checkoutData = {
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 5 }],
        subtotal: 10.0,
        tax: 1.0, // Wrong! Should be 0.725
        processingFee: 0.495,
        total: 11.495,
      };

      await expect(validateCheckoutPrices(checkoutData)).rejects.toThrow(
        "Tax mismatch"
      );
    });

    it("should reject incorrect processing fee", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
      ]);

      const checkoutData = {
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 5 }],
        subtotal: 10.0,
        tax: 0.725,
        processingFee: 1.0, // Wrong! Should be ~0.48
        total: 11.725,
      };

      await expect(validateCheckoutPrices(checkoutData)).rejects.toThrow(
        "Processing fee mismatch: expected $0.48, received $1.00"
      );
    });

    it("should reject incorrect total", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
      ]);

      const checkoutData = {
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 5 }],
        subtotal: 10.0,
        tax: 0.725,
        processingFee: 0.482625,
        total: 15.0, // Wrong! Should be ~11.21
      };

      await expect(validateCheckoutPrices(checkoutData)).rejects.toThrow(
        "Total mismatch: expected $11.21, received $15.00"
      );
    });
  });

  describe("edge cases", () => {
    it("should handle multiple items with different prices", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
        { name: "Fill Sand", pricePerTon: 4.0, unit: "ton" },
        { name: "#57 Gravel (Washed)", pricePerTon: 15.0, unit: "ton" },
      ]);

      const subtotal = 2.0 * 5 + 4.0 * 3 + 15.0 * 2; // 10 + 12 + 30 = 52
      const tax = subtotal * BUSINESS_INFO.taxRate; // 52 * 0.0725 = 3.77
      const processingFee = (subtotal + tax) * BUSINESS_INFO.creditProcessingFee; // 55.77 * 0.045 = 2.50965
      const total = subtotal + tax + processingFee; // 52 + 3.77 + 2.50965 = 58.27965

      const checkoutData = {
        items: [
          { name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 5 },
          { name: "Fill Sand", price: 4.0, unit: "ton", quantity: 3 },
          { name: "#57 Gravel (Washed)", price: 15.0, unit: "ton", quantity: 2 },
        ],
        subtotal,
        tax,
        processingFee,
        total,
      };

      const result = await validateCheckoutPrices(checkoutData);

      expect(result.subtotal).toBeCloseTo(52.0, 2);
      expect(result.tax).toBeCloseTo(3.77, 2);
      expect(result.processingFee).toBeCloseTo(2.50965, 2);
      expect(result.total).toBeCloseTo(58.27965, 2);
    });

    it("should handle single item with quantity 1", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
      ]);

      const checkoutData = {
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 1 }],
        subtotal: 2.0,
        tax: 0.145,
        processingFee: 0.096525,
        total: 2.241525,
      };

      const result = await validateCheckoutPrices(checkoutData);

      expect(result.subtotal).toBeCloseTo(2.0, 2);
      expect(result.tax).toBeCloseTo(0.145, 2);
      expect(result.processingFee).toBeCloseTo(0.096525, 2);
      expect(result.total).toBeCloseTo(2.241525, 2);
    });

    it("should handle large quantities", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
      ]);

      const subtotal = 2.0 * 100; // 200
      const tax = subtotal * BUSINESS_INFO.taxRate; // 14.5
      const processingFee = (subtotal + tax) * BUSINESS_INFO.creditProcessingFee; // 9.6525
      const total = subtotal + tax + processingFee; // 224.1525

      const checkoutData = {
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 100 }],
        subtotal,
        tax,
        processingFee,
        total,
      };

      const result = await validateCheckoutPrices(checkoutData);

      expect(result.subtotal).toBeCloseTo(200.0, 2);
      expect(result.tax).toBeCloseTo(14.5, 2);
      expect(result.processingFee).toBeCloseTo(9.6525, 2);
      expect(result.total).toBeCloseTo(224.1525, 2);
    });

    it("should use server-calculated values even when client values are within tolerance", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
      ]);

      const checkoutData = {
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 3 }],
        subtotal: 6.0,
        tax: 0.435, // Exact: 6 * 0.0725 = 0.435
        processingFee: 0.289575, // Exact: 6.435 * 0.045 = 0.289575
        total: 6.724575, // Exact: 6 + 0.435 + 0.289575 = 6.724575
      };

      const result = await validateCheckoutPrices(checkoutData);

      // Should return server-calculated values, not client values
      expect(result.subtotal).toBeCloseTo(6.0, 2);
      expect(result.tax).toBeCloseTo(0.435, 3);
      expect(result.processingFee).toBeCloseTo(0.289575, 5);
      expect(result.total).toBeCloseTo(6.724575, 5);
    });
  });

  describe("rounding tolerance", () => {
    it("should accept cumulative rounding within 2 cent tolerance for total", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
      ]);

      const checkoutData = {
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 7 }],
        subtotal: 14.0,
        tax: 1.015, // 14 * 0.0725 = 1.015
        processingFee: 0.676, // (14 + 1.015) * 0.045 = 0.67568 (rounded to 0.676)
        total: 15.69, // 14 + 1.015 + 0.67568 = 15.69068 (client sends 15.69)
      };

      const result = await validateCheckoutPrices(checkoutData);

      expect(result).toBeDefined();
      expect(result.total).toBeCloseTo(15.69068, 2);
    });

    it("should reject cumulative rounding beyond 2 cent tolerance", async () => {
      vi.mocked(sanityClient.fetch).mockResolvedValue([
        { name: "Fill Dirt", pricePerTon: 2.0, unit: "ton" },
      ]);

      const checkoutData = {
        items: [{ name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 7 }],
        subtotal: 14.0,
        tax: 1.015,
        processingFee: 0.676,
        total: 15.65, // Off by more than 2 cents from 15.69068
      };

      await expect(validateCheckoutPrices(checkoutData)).rejects.toThrow(
        "Total mismatch"
      );
    });
  });
});
