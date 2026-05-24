import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/quote/route";
import { prisma } from "@/lib/prisma";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    quoteRequest: {
      create: vi.fn(),
    },
  },
}));

// Mock Postmark with a module factory
vi.mock("postmark");

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
  let mockPostmarkSendEmail: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup Postmark mock
    const postmark = await import("postmark");
    mockPostmarkSendEmail = vi.fn().mockResolvedValue({ MessageID: "test-123" });
    vi.mocked(postmark.ServerClient).mockImplementation(function () {
      return {
        sendEmail: mockPostmarkSendEmail,
      } as any;
    } as any);

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
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(validQuoteData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
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
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(minimalQuoteData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(prisma.quoteRequest.create).toHaveBeenCalledWith({
        data: {
          name: "Jane Smith",
          email: "jane@example.com",
          phone: null,
          company: null,
          products: [{ productName: "Fill Dirt", quantity: "10 tons" }],
          deliveryAddr: null,
          notes: null,
        },
      });
    });

    it("should send email notification when Postmark is configured", async () => {
      const mockQuoteRequest = {
        id: "quote_123",
        ...validQuoteData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(validQuoteData),
      });

      await POST(request as any);

      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Quote Request from John Doe",
        TextBody: expect.stringContaining("Name: John Doe"),
        ReplyTo: "john@example.com",
      });
      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Quote Request from John Doe",
        TextBody: expect.stringContaining("Email: john@example.com"),
        ReplyTo: "john@example.com",
      });
      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Quote Request from John Doe",
        TextBody: expect.stringContaining("Phone: 7403190183"),
        ReplyTo: "john@example.com",
      });
      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Quote Request from John Doe",
        TextBody: expect.stringContaining("Company: Acme Construction"),
        ReplyTo: "john@example.com",
      });
      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Quote Request from John Doe",
        TextBody: expect.stringContaining("Fill Dirt: 10 tons"),
        ReplyTo: "john@example.com",
      });
      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Quote Request from John Doe",
        TextBody: expect.stringContaining("Fill Sand: 5 tons"),
        ReplyTo: "john@example.com",
      });
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
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(minimalQuoteData),
      });

      await POST(request as any);

      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Quote Request from Jane Smith",
        TextBody: expect.stringContaining("Phone: Not provided"),
        ReplyTo: "jane@example.com",
      });
      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Quote Request from Jane Smith",
        TextBody: expect.stringContaining("Company: Not provided"),
        ReplyTo: "jane@example.com",
      });
      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Quote Request from Jane Smith",
        TextBody: expect.stringContaining("Delivery Address: Pickup"),
        ReplyTo: "jane@example.com",
      });
      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Quote Request from Jane Smith",
        TextBody: expect.stringContaining("Notes: None"),
        ReplyTo: "jane@example.com",
      });
    });

    it("should not send email when Postmark is not configured", async () => {
      delete process.env.POSTMARK_API_TOKEN;

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
      expect(data).toEqual({ success: true });
      expect(mockPostmarkSendEmail).not.toHaveBeenCalled();
    });

    it("should succeed even if email sending fails", async () => {
      const mockQuoteRequest = {
        id: "quote_123",
        ...validQuoteData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);
      mockPostmarkSendEmail.mockRejectedValue(new Error("Email service down"));

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(validQuoteData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
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
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(dataWithEmptyProducts),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
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

      expect(mockPostmarkSendEmail).not.toHaveBeenCalled();
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
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(dataWithEmptyOptionals),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
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
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(multiProductData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
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
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(dataWithSpecialChars),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
    });

    it("should use default from email if not configured", async () => {
      delete process.env.POSTMARK_FROM_EMAIL;

      const mockQuoteRequest = {
        id: "quote_123",
        ...validQuoteData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quoteRequest.create).mockResolvedValue(mockQuoteRequest as any);
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(validQuoteData),
      });

      await POST(request as any);

      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@muskingummaterials.com",
        To: "sales@muskingummaterials.com",
        Subject: "Quote Request from John Doe",
        TextBody: expect.any(String),
        ReplyTo: "john@example.com",
      });
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
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/quote", {
        method: "POST",
        body: JSON.stringify(dataWithLongNotes),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
    });
  });
});
