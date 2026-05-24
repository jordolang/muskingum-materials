import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/contact/route";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    contactSubmission: {
      create: vi.fn(),
    },
  },
}));

// Mock Postmark with a module factory
vi.mock("postmark");

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("POST /api/contact", () => {
  const validContactData = {
    name: "John Doe",
    email: "john@example.com",
    phone: "7403190183",
    subject: "General Inquiry",
    message: "I would like to know more about your products and services.",
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
    it("should save contact form to database and return success", async () => {
      const mockSubmission = {
        id: "submission_123",
        ...validContactData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.contactSubmission.create).mockResolvedValue(mockSubmission as any);
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(validContactData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(prisma.contactSubmission.create).toHaveBeenCalledWith({
        data: {
          name: "John Doe",
          email: "john@example.com",
          phone: "7403190183",
          subject: "General Inquiry",
          message: "I would like to know more about your products and services.",
        },
      });
    });

    it("should save contact form without optional phone number", async () => {
      const dataWithoutPhone = {
        ...validContactData,
        phone: undefined,
      };

      const mockSubmission = {
        id: "submission_123",
        name: validContactData.name,
        email: validContactData.email,
        phone: null,
        subject: validContactData.subject,
        message: validContactData.message,
        createdAt: new Date(),
      };

      vi.mocked(prisma.contactSubmission.create).mockResolvedValue(mockSubmission as any);
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(dataWithoutPhone),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(prisma.contactSubmission.create).toHaveBeenCalledWith({
        data: {
          name: "John Doe",
          email: "john@example.com",
          phone: null,
          subject: "General Inquiry",
          message: "I would like to know more about your products and services.",
        },
      });
    });

    it("should send email notification when Postmark is configured", async () => {
      const mockSubmission = {
        id: "submission_123",
        ...validContactData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.contactSubmission.create).mockResolvedValue(mockSubmission as any);
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(validContactData),
      });

      await POST(request as any);

      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Website Contact: General Inquiry",
        TextBody: expect.stringContaining("Name: John Doe"),
        ReplyTo: "john@example.com",
      });
      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Website Contact: General Inquiry",
        TextBody: expect.stringContaining("Email: john@example.com"),
        ReplyTo: "john@example.com",
      });
      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Website Contact: General Inquiry",
        TextBody: expect.stringContaining("Phone: 7403190183"),
        ReplyTo: "john@example.com",
      });
      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Website Contact: General Inquiry",
        TextBody: expect.stringContaining("Subject: General Inquiry"),
        ReplyTo: "john@example.com",
      });
    });

    it("should include 'Not provided' for missing phone in email", async () => {
      const dataWithoutPhone = {
        ...validContactData,
        phone: undefined,
      };

      const mockSubmission = {
        id: "submission_123",
        name: validContactData.name,
        email: validContactData.email,
        phone: null,
        subject: validContactData.subject,
        message: validContactData.message,
        createdAt: new Date(),
      };

      vi.mocked(prisma.contactSubmission.create).mockResolvedValue(mockSubmission as any);
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(dataWithoutPhone),
      });

      await POST(request as any);

      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@test.com",
        To: "sales@muskingummaterials.com",
        Subject: "Website Contact: General Inquiry",
        TextBody: expect.stringContaining("Phone: Not provided"),
        ReplyTo: "john@example.com",
      });
    });

    it("should not send email when Postmark is not configured", async () => {
      delete process.env.POSTMARK_API_TOKEN;

      const mockSubmission = {
        id: "submission_123",
        ...validContactData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.contactSubmission.create).mockResolvedValue(mockSubmission as any);

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(validContactData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(mockPostmarkSendEmail).not.toHaveBeenCalled();
    });

    it("should succeed even if email sending fails", async () => {
      const mockSubmission = {
        id: "submission_123",
        ...validContactData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.contactSubmission.create).mockResolvedValue(mockSubmission as any);
      mockPostmarkSendEmail.mockRejectedValue(new Error("Email service down"));

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(validContactData),
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
        ...validContactData,
        name: "J", // Too short
      };

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid form data");
      expect(data.details).toBeDefined();
      expect(prisma.contactSubmission.create).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid email", async () => {
      const invalidData = {
        ...validContactData,
        email: "not-an-email",
      };

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid form data");
      expect(data.details).toBeDefined();
      expect(prisma.contactSubmission.create).not.toHaveBeenCalled();
    });

    it("should return 400 for missing subject", async () => {
      const invalidData = {
        ...validContactData,
        subject: "X", // Too short
      };

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid form data");
      expect(data.details).toBeDefined();
      expect(prisma.contactSubmission.create).not.toHaveBeenCalled();
    });

    it("should return 400 for message too short", async () => {
      const invalidData = {
        ...validContactData,
        message: "Hi", // Less than 10 characters
      };

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid form data");
      expect(data.details).toBeDefined();
      expect(prisma.contactSubmission.create).not.toHaveBeenCalled();
    });

    it("should return 400 for missing required fields", async () => {
      const invalidData = {
        name: "John Doe",
        // missing email, subject, message
      };

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid form data");
      expect(data.details).toBeDefined();
      expect(prisma.contactSubmission.create).not.toHaveBeenCalled();
    });
  });

  describe("database errors", () => {
    it("should return 500 if database save fails", async () => {
      vi.mocked(prisma.contactSubmission.create).mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(validContactData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to save contact submission");
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        "Database error saving contact submission",
        expect.any(Error),
        expect.objectContaining({
          operation: "contactSubmission.create",
          email: "john@example.com",
          subject: "General Inquiry",
        })
      );
    });

    it("should log database errors with context", async () => {
      const dbError = new Error("Unique constraint violation");
      vi.mocked(prisma.contactSubmission.create).mockRejectedValue(dbError);

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(validContactData),
      });

      await POST(request as any);

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        "Database error saving contact submission",
        dbError,
        {
          operation: "contactSubmission.create",
          email: "john@example.com",
          subject: "General Inquiry",
        }
      );
    });

    it("should not send email if database save fails", async () => {
      vi.mocked(prisma.contactSubmission.create).mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(validContactData),
      });

      await POST(request as any);

      expect(mockPostmarkSendEmail).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should return 500 for unexpected errors", async () => {
      // Force an unexpected error by rejecting the database call
      vi.mocked(prisma.contactSubmission.create).mockRejectedValue(
        new TypeError("Unexpected database error")
      );

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(validContactData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to save contact submission");
    });

    it("should handle malformed JSON request body", async () => {
      const request = new Request("http://localhost:3000/api/contact", {
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
    it("should handle empty string for optional phone field", async () => {
      const dataWithEmptyPhone = {
        ...validContactData,
        phone: "",
      };

      const mockSubmission = {
        id: "submission_123",
        name: validContactData.name,
        email: validContactData.email,
        phone: null,
        subject: validContactData.subject,
        message: validContactData.message,
        createdAt: new Date(),
      };

      vi.mocked(prisma.contactSubmission.create).mockResolvedValue(mockSubmission as any);
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(dataWithEmptyPhone),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
    });

    it("should handle long message content", async () => {
      const longMessage = "A".repeat(5000); // Very long message
      const dataWithLongMessage = {
        ...validContactData,
        message: longMessage,
      };

      const mockSubmission = {
        id: "submission_123",
        ...dataWithLongMessage,
        createdAt: new Date(),
      };

      vi.mocked(prisma.contactSubmission.create).mockResolvedValue(mockSubmission as any);
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(dataWithLongMessage),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
    });

    it("should handle special characters in input", async () => {
      const dataWithSpecialChars = {
        name: "José O'Brien <test@example.com>",
        email: "jose@example.com",
        phone: "(740) 319-0183",
        subject: "Testing: Special & Characters!",
        message: "Message with special chars: \n\t<script>alert('test')</script>",
      };

      const mockSubmission = {
        id: "submission_123",
        ...dataWithSpecialChars,
        createdAt: new Date(),
      };

      vi.mocked(prisma.contactSubmission.create).mockResolvedValue(mockSubmission as any);
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/contact", {
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

      const mockSubmission = {
        id: "submission_123",
        ...validContactData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.contactSubmission.create).mockResolvedValue(mockSubmission as any);
      mockPostmarkSendEmail.mockResolvedValue({ MessageID: "test-123" });

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(validContactData),
      });

      await POST(request as any);

      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "noreply@muskingummaterials.com",
        To: "sales@muskingummaterials.com",
        Subject: "Website Contact: General Inquiry",
        TextBody: expect.any(String),
        ReplyTo: "john@example.com",
      });
    });
  });
});
