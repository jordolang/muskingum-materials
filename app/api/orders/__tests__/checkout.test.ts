import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/orders/checkout/route";
import { prisma } from "@/lib/prisma";
import { validateCheckoutPrices } from "@/lib/validate-checkout-prices";
import { auth } from "@clerk/nextjs/server";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/validate-checkout-prices", () => ({
  validateCheckoutPrices: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock Stripe
const mockStripeCheckoutSessions = {
  create: vi.fn(),
};

const MockStripe = vi.fn().mockImplementation(function () {
  return {
    checkout: {
      sessions: mockStripeCheckoutSessions,
    },
  };
});

vi.mock("stripe", () => ({
  default: MockStripe,
}));

// Mock Postmark
const mockPostmarkSendEmail = vi.fn();
const MockPostmarkClient = vi.fn().mockImplementation(function () {
  return {
    sendEmail: mockPostmarkSendEmail,
  };
});

vi.mock("postmark", () => ({
  ServerClient: MockPostmarkClient,
}));

describe("POST /api/orders/checkout", () => {
  const validCheckoutData = {
    name: "John Doe",
    email: "john@example.com",
    phone: "7403190183",
    fulfillment: "pickup",
    items: [
      { name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 5 },
    ],
    subtotal: 10.0,
    tax: 0.725,
    processingFee: 0.482625,
    total: 11.207625,
  };

  const validatedPrices = {
    subtotal: 10.0,
    tax: 0.725,
    processingFee: 0.482625,
    total: 11.207625,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateCheckoutPrices).mockResolvedValue(validatedPrices);
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    // Mock environment variables
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.POSTMARK_API_TOKEN = "test-token";
    process.env.POSTMARK_FROM_EMAIL = "noreply@test.com";
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.POSTMARK_API_TOKEN;
    delete process.env.POSTMARK_FROM_EMAIL;
  });

  describe("successful checkout with Stripe", () => {
    it("should create order and return Stripe checkout URL", async () => {
      const mockOrder = {
        id: "order_123",
        orderNumber: "MM-260423-ABCD1234",
        ...validCheckoutData,
        ...validatedPrices,
        status: "pending",
        paymentStatus: "unpaid",
      };

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);

      const mockStripeSession = {
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
      };
      mockStripeCheckoutSessions.create.mockResolvedValue(mockStripeSession);
      vi.mocked(prisma.order.update).mockResolvedValue(mockOrder as any);

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(validCheckoutData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ url: mockStripeSession.url });
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "John Doe",
          email: "john@example.com",
          phone: "7403190183",
          pickupOrDeliver: "pickup",
          status: "pending",
          paymentStatus: "unpaid",
          subtotal: 10.0,
          tax: 0.725,
          processingFee: 0.482625,
          total: 11.207625,
        }),
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: mockOrder.id },
        data: { stripeSessionId: mockStripeSession.id },
      });
    });

    it("should create Stripe session with correct line items", async () => {
      const mockOrder = {
        id: "order_123",
        orderNumber: "MM-260423-ABCD1234",
      };

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      mockStripeCheckoutSessions.create.mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
      });

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(validCheckoutData),
      });

      await POST(request as any);

      expect(mockStripeCheckoutSessions.create).toHaveBeenCalledWith({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Fill Dirt",
                description: "5 tons of Fill Dirt",
              },
              unit_amount: 200, // $2.00 * 100
            },
            quantity: 5,
          },
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Ohio Sales Tax (7.25%)",
                description: "State sales tax",
              },
              unit_amount: 73, // $0.725 * 100 rounded
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Credit Card Processing Fee (4.5%)",
                description: "Card processing fee",
              },
              unit_amount: 48, // $0.482625 * 100 rounded
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: expect.stringContaining("/order/success?order="),
        cancel_url: expect.stringContaining("/order?canceled=true"),
        customer_email: "john@example.com",
        metadata: {
          orderNumber: expect.stringMatching(/^MM-\d{6}-[A-Z0-9]{8}$/),
          customerName: "John Doe",
          customerPhone: "7403190183",
          fulfillment: "pickup",
        },
      });
    });

    it("should handle authenticated user checkout", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any);

      const mockOrder = {
        id: "order_123",
        orderNumber: "MM-260423-ABCD1234",
      };

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      mockStripeCheckoutSessions.create.mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
      });

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(validCheckoutData),
      });

      await POST(request as any);

      expect(prisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user_123",
        }),
      });
    });

    it("should handle delivery orders with address and notes", async () => {
      const deliveryData = {
        ...validCheckoutData,
        fulfillment: "delivery",
        deliveryAddress: "123 Main St, Zanesville, OH 43701",
        deliveryNotes: "Leave at front gate",
      };

      const mockOrder = {
        id: "order_123",
        orderNumber: "MM-260423-ABCD1234",
      };

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      mockStripeCheckoutSessions.create.mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
      });

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(deliveryData),
      });

      await POST(request as any);

      expect(prisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          pickupOrDeliver: "delivery",
          deliveryAddress: "123 Main St, Zanesville, OH 43701",
          deliveryNotes: "Leave at front gate",
        }),
      });
    });
  });

  describe("successful checkout without Stripe", () => {
    beforeEach(() => {
      delete process.env.STRIPE_SECRET_KEY;
    });

    it("should create order and send email notification", async () => {
      const mockOrder = {
        id: "order_123",
        orderNumber: "MM-260423-ABCD1234",
      };

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(validCheckoutData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ orderNumber: expect.stringMatching(/^MM-\d{6}-[A-Z0-9]{8}$/) });
      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: expect.stringContaining("New Online Order"),
        TextBody: expect.stringContaining("Fill Dirt"),
        ReplyTo: "john@example.com",
      });
    });

    it("should not fail if email sending fails", async () => {
      const mockOrder = {
        id: "order_123",
        orderNumber: "MM-260423-ABCD1234",
      };

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      mockPostmarkSendEmail.mockRejectedValue(new Error("Email service down"));

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(validCheckoutData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ orderNumber: expect.stringMatching(/^MM-\d{6}-[A-Z0-9]{8}$/) });
    });
  });

  describe("Stripe fallback behavior", () => {
    it("should fall back to non-Stripe flow when Stripe fails", async () => {
      const mockOrder = {
        id: "order_123",
        orderNumber: "MM-260423-ABCD1234",
      };

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      mockStripeCheckoutSessions.create.mockRejectedValue(new Error("Stripe API error"));
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(validCheckoutData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ orderNumber: expect.stringMatching(/^MM-\d{6}-[A-Z0-9]{8}$/) });
      expect(mockPostmarkSendEmail).toHaveBeenCalled();
    });

    it("should continue if Stripe session ID update fails", async () => {
      const mockOrder = {
        id: "order_123",
        orderNumber: "MM-260423-ABCD1234",
      };

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      mockStripeCheckoutSessions.create.mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
      });
      vi.mocked(prisma.order.update).mockRejectedValue(new Error("Database error"));

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(validCheckoutData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ url: "https://checkout.stripe.com/pay/cs_test_123" });
    });
  });

  describe("validation errors", () => {
    it("should return 400 for invalid request body", async () => {
      const invalidData = {
        name: "J", // Too short
        email: "not-an-email",
        // missing required fields
      };

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid order data");
      expect(data.details).toBeDefined();
    });

    it("should return 400 for price validation failure", async () => {
      vi.mocked(validateCheckoutPrices).mockRejectedValue(
        new Error('Price mismatch for "Fill Dirt": expected $2.00, received $3.00')
      );

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(validCheckoutData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Price mismatch for "Fill Dirt": expected $2.00, received $3.00');
    });

    it("should handle non-Error price validation failures", async () => {
      vi.mocked(validateCheckoutPrices).mockRejectedValue("Unknown error");

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(validCheckoutData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Price validation failed");
    });
  });

  describe("error handling", () => {
    it("should return 500 if order creation fails", async () => {
      vi.mocked(prisma.order.create).mockRejectedValue(new Error("Database connection failed"));

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(validCheckoutData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create order. Please try again or call (740) 319-0183.");
    });

    it("should handle auth errors gracefully for guest checkout", async () => {
      vi.mocked(auth).mockRejectedValue(new Error("Auth service unavailable"));

      const mockOrder = {
        id: "order_123",
        orderNumber: "MM-260423-ABCD1234",
      };

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      mockStripeCheckoutSessions.create.mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
      });

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(validCheckoutData),
      });

      const response = await POST(request as any);

      expect(response.status).toBe(200);
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
        }),
      });
    });

    it("should return 500 for unexpected errors", async () => {
      // Force an unexpected error by throwing a non-Zod, non-validation error
      vi.mocked(prisma.order.create).mockImplementation(() => {
        throw new TypeError("Unexpected database error");
      });

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(validCheckoutData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create order. Please try again or call (740) 319-0183.");
    });
  });

  describe("edge cases", () => {
    it("should handle multiple items in order", async () => {
      const multiItemData = {
        ...validCheckoutData,
        items: [
          { name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 5 },
          { name: "Fill Sand", price: 4.0, unit: "ton", quantity: 3 },
        ],
        subtotal: 22.0,
        tax: 1.595,
        processingFee: 1.062,
        total: 24.657,
      };

      const multiItemPrices = {
        subtotal: 22.0,
        tax: 1.595,
        processingFee: 1.062,
        total: 24.657,
      };

      vi.mocked(validateCheckoutPrices).mockResolvedValue(multiItemPrices);

      const mockOrder = {
        id: "order_123",
        orderNumber: "MM-260423-ABCD1234",
      };

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      mockStripeCheckoutSessions.create.mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
      });

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(multiItemData),
      });

      const response = await POST(request as any);

      expect(response.status).toBe(200);
      expect(mockStripeCheckoutSessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: expect.objectContaining({
                  name: "Fill Dirt",
                }),
              }),
              quantity: 5,
            }),
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: expect.objectContaining({
                  name: "Fill Sand",
                }),
              }),
              quantity: 3,
            }),
          ]),
        })
      );
    });

    it("should generate unique order numbers", async () => {
      const mockOrder = {
        id: "order_123",
        orderNumber: "MM-260423-ABCD1234",
      };

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      delete process.env.STRIPE_SECRET_KEY;

      const request1 = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(validCheckoutData),
      });

      const request2 = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(validCheckoutData),
      });

      const response1 = await POST(request1 as any);
      const data1 = await response1.json();

      const response2 = await POST(request2 as any);
      const data2 = await response2.json();

      // Both should be valid order numbers
      expect(data1.orderNumber).toMatch(/^MM-\d{6}-[A-Z0-9]{8}$/);
      expect(data2.orderNumber).toMatch(/^MM-\d{6}-[A-Z0-9]{8}$/);

      // They should be different (very high probability with UUID random part)
      expect(data1.orderNumber).not.toBe(data2.orderNumber);
    });

    it("should handle pickup orders without delivery info", async () => {
      const pickupData = {
        ...validCheckoutData,
        fulfillment: "pickup",
        // No deliveryAddress or deliveryNotes
      };

      const mockOrder = {
        id: "order_123",
        orderNumber: "MM-260423-ABCD1234",
      };

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      mockStripeCheckoutSessions.create.mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
      });

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(pickupData),
      });

      await POST(request as any);

      expect(prisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          pickupOrDeliver: "pickup",
          deliveryAddress: null,
          deliveryNotes: null,
        }),
      });
    });

    it("should handle single item quantity 1 description correctly", async () => {
      const singleItemData = {
        ...validCheckoutData,
        items: [
          { name: "Fill Dirt", price: 2.0, unit: "ton", quantity: 1 },
        ],
        subtotal: 2.0,
        tax: 0.145,
        processingFee: 0.096525,
        total: 2.241525,
      };

      vi.mocked(validateCheckoutPrices).mockResolvedValue({
        subtotal: 2.0,
        tax: 0.145,
        processingFee: 0.096525,
        total: 2.241525,
      });

      const mockOrder = {
        id: "order_123",
        orderNumber: "MM-260423-ABCD1234",
      };

      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      mockStripeCheckoutSessions.create.mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
      });

      const request = new Request("http://localhost:3000/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify(singleItemData),
      });

      await POST(request as any);

      expect(mockStripeCheckoutSessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: expect.objectContaining({
                  description: "1 ton of Fill Dirt", // No 's' for singular
                }),
              }),
            }),
          ]),
        })
      );
    });
  });
});
