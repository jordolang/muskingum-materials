import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/quote/route";
import { prisma } from "@/lib/prisma";
import type { EmailSendResult } from "@/lib/email-service";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    quoteRequest: {
      create: vi.fn(),
    },
  },
}));

// Mock email-service instead of mocking Postmark directly
vi.mock("@/lib/email-service", () => ({
  sendNotificationEmail: vi.fn(),
}));

// Mock logger (if used in route)
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("POST /api/quote", () => {
  const validQuoteData = {
    name: "John Doe",
    email: "john@example.com",
    phone: "7403190183",
    company: "Acme Construction",
    products: [
      { productName: "Fill Dirt", quantity: "10 tons" },
      { productName: "Fill Sand", quantity: "5 tons" },
    ],
    deliveryAddr: "123 Main St, Zanesville, OH 43701",
    notes: "Need delivery by next week",
  };

  // Get mock references
  let mockSendNotificationEmail: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup email-service mock
    const emailService = await import("@/lib/email-service");
    mockSendNotificationEmail = vi.mocked(emailService.sendNotificationEmail);
    mockSendNotificationEmail.mockResolvedValue({
      success: true,
      messageId: "test-123"
    } as EmailSendResult);

    // Mock environment variables
    process.env.POSTMARK_API_TOKEN = "test-token";
    process.env.POSTMARK_FROM_EMAIL = "noreply@test.com";
  });

  afterEach(() => {
    delete process.env.POSTMARK_API_TOKEN;
    delete process.env.POSTMARK_FROM_EMAIL;
  });

  describe("successful submission", () => {
    it("should save quote request to database and return success", async () => {
      const mockQuoteRequest = {
        id: "quote_123",
        ...validQuoteData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(validQuoteData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ success: true });
      expect(prisma.quoteRequest.create).toHaveBeenCalledWith({
        data: {
          name: "John Doe",
          email: "john@example.com",
          phone: "7403190183",
          company: "Acme Construction",
          products: [
            { productName: "Fill Dirt", quantity: "10 tons" },
            { productName: "Fill Sand", quantity: "5 tons" },
          ],
          deliveryAddr: "123 Main St, Zanesville, OH 43701",
          notes: "Need delivery by next week",
          projectAddress: null,
          projectLat: null,
          projectLng: null,
          projectAreaSqFt: null,
          projectDepthInches: null,
          projectEstimateTons: null,
          projectEstimateCubicYards: null,
          projectEstimateSource: null,
          projectPolygons: undefined,
          projectMapImageUrl: null,
          projectEstimateTonsLow: null,
          projectEstimateTonsHigh: null,
          projectEstimateCubicYardsLow: null,
          projectEstimateCubicYardsHigh: null,
        },
      });
    });

    it("should save quote request without optional fields", async () => {
      const minimalQuoteData = {
        name: "Jane Smith",
        email: "jane@example.com",
        products: [
          { productName: "Fill Dirt", quantity: "10 tons" },
        ],
      };

      const mockQuoteRequest = {
        id: "quote_123",
        name: "Jane Smith",
        email: "jane@example.com",
        phone: null,
        company: null,
        products: [{ productName: "Fill Dirt", quantity: "10 tons" }],
        deliveryAddr: null,
        notes: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(minimalQuoteData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ success: true });
      expect(prisma.quoteRequest.create).toHaveBeenCalledWith({
        data: {
          name: "Jane Smith",
          email: "jane@example.com",
          phone: null,
          company: null,
          products: [{ productName: "Fill Dirt", quantity: "10 tons" }],
          deliveryAddr: null,
          notes: null,
          projectAddress: null,
          projectLat: null,
          projectLng: null,
          projectAreaSqFt: null,
          projectDepthInches: null,
          projectEstimateTons: null,
          projectEstimateCubicYards: null,
          projectEstimateSource: null,
          projectPolygons: undefined,
          projectMapImageUrl: null,
          projectEstimateTonsLow: null,
          projectEstimateTonsHigh: null,
          projectEstimateCubicYardsLow: null,
          projectEstimateCubicYardsHigh: null,
        },
      });
    });

    it("should send email notification via email-service", async () => {
      const mockQuoteRequest = {
        id: "quote_123",
        ...validQuoteData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(validQuoteData),
      });

      await POST(request as any);

      expect(mockSendNotificationEmail).toHaveBeenCalledWith(
        "Quote Request from John Doe",
        expect.stringContaining("Name: John Doe"),
        {
          replyTo: "john@example.com",
          tag: "quote-request",
          metadata: {
            quoteName: "John Doe",
            quoteEmail: "john@example.com",
            productCount: "2",
            company: "Acme Construction",
          },
        }
      );

      // Verify all expected content is in the email body
      const callArgs = mockSendNotificationEmail.mock.calls[0];
      const emailBody = callArgs[1];
      expect(emailBody).toContain("Email: john@example.com");
      expect(emailBody).toContain("Phone: 7403190183");
      expect(emailBody).toContain("Company: Acme Construction");
      expect(emailBody).toContain("Fill Dirt: 10 tons");
      expect(emailBody).toContain("Fill Sand: 5 tons");
    });

    it("should include 'Not provided' for missing optional fields in email", async () => {
      const minimalQuoteData = {
        name: "Jane Smith",
        email: "jane@example.com",
        products: [
          { productName: "Fill Dirt", quantity: "10 tons" },
        ],
      };

      const mockQuoteRequest = {
        id: "quote_123",
        name: "Jane Smith",
        email: "jane@example.com",
        phone: null,
        company: null,
        products: [{ productName: "Fill Dirt", quantity: "10 tons" }],
        deliveryAddr: null,
        notes: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(minimalQuoteData),
      });

      await POST(request as any);

      const callArgs = mockSendNotificationEmail.mock.calls[0];
      const emailBody = callArgs[1];
      expect(emailBody).toContain("Phone: Not provided");
      expect(emailBody).toContain("Company: Not provided");
      expect(emailBody).toContain("Delivery Address: Pickup");
      expect(emailBody).toContain("Notes: None");

      // Verify metadata reflects missing company
      const emailOptions = callArgs[2];
      expect(emailOptions?.metadata?.company).toBe("none");
    });

    it("should succeed even if email sending fails", async () => {
      const mockQuoteRequest = {
        id: "quote_123",
        ...validQuoteData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);
      mockSendNotificationEmail.mockResolvedValue({
        success: false,
        error: "Email service down"
      } as EmailSendResult);

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(validQuoteData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ success: true });
    });
  });

  describe("validation errors", () => {
    it("should return 400 for missing name", async () => {
      const invalidData = {
        ...validQuoteData,
        name: "J", // Too short
      };

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
      expect(data.details).toBeDefined();
      expect(prisma.quoteRequest.create).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid email", async () => {
      const invalidData = {
        ...validQuoteData,
        email: "not-an-email",
      };

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
      expect(data.details).toBeDefined();
      expect(prisma.quoteRequest.create).not.toHaveBeenCalled();
    });

    it("should allow empty products array", async () => {
      const dataWithEmptyProducts = {
        name: "John Doe",
        email: "john@example.com",
        products: [],
      };

      const mockQuoteRequest = {
        id: "quote_123",
        ...dataWithEmptyProducts,
        phone: null,
        company: null,
        deliveryAddr: null,
        notes: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(dataWithEmptyProducts),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ success: true });
    });

    it("should return 400 for missing required fields", async () => {
      const invalidData = {
        name: "John Doe",
        // missing email and products
      };

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
      expect(data.details).toBeDefined();
      expect(prisma.quoteRequest.create).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid product structure", async () => {
      const invalidData = {
        ...validQuoteData,
        products: [
          { productName: "Fill Dirt" }, // Missing quantity
        ],
      };

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid data");
      expect(data.details).toBeDefined();
      expect(prisma.quoteRequest.create).not.toHaveBeenCalled();
    });
  });

  describe("database errors", () => {
    it("should return 500 if database save fails", async () => {
      vi.mocked(prisma.quoteRequest.create).mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(validQuoteData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to save quote request");
    });

    it("should not send email if database save fails", async () => {
      vi.mocked(prisma.quoteRequest.create).mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(validQuoteData),
      });

      await POST(request as any);

      expect(mockSendNotificationEmail).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should return 500 for unexpected errors", async () => {
      vi.mocked(prisma.quoteRequest.create).mockRejectedValue(
        new TypeError("Unexpected database error")
      );

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(validQuoteData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to save quote request");
    });

    it("should handle malformed JSON request body", async () => {
      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: "not valid json{",
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string for optional fields", async () => {
      const dataWithEmptyOptionals = {
        name: "John Doe",
        email: "john@example.com",
        phone: "",
        company: "",
        products: [
          { productName: "Fill Dirt", quantity: "10 tons" },
        ],
        deliveryAddr: "",
        notes: "",
      };

      const mockQuoteRequest = {
        id: "quote_123",
        name: "John Doe",
        email: "john@example.com",
        phone: null,
        company: null,
        products: [{ productName: "Fill Dirt", quantity: "10 tons" }],
        deliveryAddr: null,
        notes: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(dataWithEmptyOptionals),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ success: true });
    });

    it("should handle multiple products", async () => {
      const multiProductData = {
        ...validQuoteData,
        products: [
          { productName: "Fill Dirt", quantity: "10 tons" },
          { productName: "Fill Sand", quantity: "5 tons" },
          { productName: "Topsoil", quantity: "3 yards" },
        ],
      };

      const mockQuoteRequest = {
        id: "quote_123",
        ...multiProductData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(multiProductData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ success: true });
      expect(prisma.quoteRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          products: [
            { productName: "Fill Dirt", quantity: "10 tons" },
            { productName: "Fill Sand", quantity: "5 tons" },
            { productName: "Topsoil", quantity: "3 yards" },
          ],
        }),
      });
    });

    it("should handle special characters in input", async () => {
      const dataWithSpecialChars = {
        name: "José O'Brien <test@example.com>",
        email: "jose@example.com",
        phone: "(740) 319-0183",
        company: "O'Reilly & Sons Construction Co.",
        products: [
          { productName: "Fill Dirt (Premium)", quantity: "10+ tons" },
        ],
        deliveryAddr: "123 Main St, Apt #4\nZanesville, OH 43701",
        notes: "Special instructions: \n\t- Call before delivery\n\t- Use side gate",
      };

      const mockQuoteRequest = {
        id: "quote_123",
        ...dataWithSpecialChars,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(dataWithSpecialChars),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ success: true });
    });

    it("should handle long notes content", async () => {
      const longNotes = "A".repeat(5000); // Very long notes
      const dataWithLongNotes = {
        ...validQuoteData,
        notes: longNotes,
      };

      const mockQuoteRequest = {
        id: "quote_123",
        ...dataWithLongNotes,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(dataWithLongNotes),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ success: true });
    });
  });

  describe("email-service integration", () => {
    it("should pass correct tag and metadata to email-service", async () => {
      const mockQuoteRequest = {
        id: "quote_123",
        ...validQuoteData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(validQuoteData),
      });

      await POST(request as any);

      expect(mockSendNotificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        {
          replyTo: "john@example.com",
          tag: "quote-request",
          metadata: {
            quoteName: "John Doe",
            quoteEmail: "john@example.com",
            productCount: "2",
            company: "Acme Construction",
          },
        }
      );
    });

    it("should include replyTo in email options", async () => {
      const mockQuoteRequest = {
        id: "quote_123",
        ...validQuoteData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(validQuoteData),
      });

      await POST(request as any);

      const callArgs = mockSendNotificationEmail.mock.calls[0];
      const emailOptions = callArgs[2];
      expect(emailOptions?.replyTo).toBe("john@example.com");
    });

    it("should include product count in metadata", async () => {
      const mockQuoteRequest = {
        id: "quote_123",
        ...validQuoteData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(validQuoteData),
      });

      await POST(request as any);

      const callArgs = mockSendNotificationEmail.mock.calls[0];
      const emailOptions = callArgs[2];
      expect(emailOptions?.metadata?.productCount).toBe("2");
    });
  });
});
