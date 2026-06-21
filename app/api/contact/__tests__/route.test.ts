import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/contact/route";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { EmailSendResult } from "@/lib/email-service";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    contactSubmission: {
      create: vi.fn(),
    },
  },
}));

// Mock email-service instead of mocking Postmark directly
vi.mock("@/lib/email-service", () => ({
  sendNotificationEmail: vi.fn(),
}));

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
    it("should save contact form to database and return success", async () => {
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
      expect(data).toMatchObject({ success: true });
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

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(dataWithoutPhone),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ success: true });
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

    it("should send email notification via email-service", async () => {
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

      await POST(request as any);

      expect(mockSendNotificationEmail).toHaveBeenCalledWith(
        "Website Contact: General Inquiry",
        expect.stringContaining("Name: John Doe"),
        {
          replyTo: "john@example.com",
          tag: "contact-form",
          metadata: {
            contactName: "John Doe",
            contactEmail: "john@example.com",
            subject: "General Inquiry",
          },
        }
      );

      // Verify all expected content is in the email body
      const callArgs = mockSendNotificationEmail.mock.calls[0];
      const emailBody = callArgs[1];
      expect(emailBody).toContain("Email: john@example.com");
      expect(emailBody).toContain("Phone: 7403190183");
      expect(emailBody).toContain("Subject: General Inquiry");
      expect(emailBody).toContain("I would like to know more about your products and services.");
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

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(dataWithoutPhone),
      });

      await POST(request as any);

      const callArgs = mockSendNotificationEmail.mock.calls[0];
      const emailBody = callArgs[1];
      expect(emailBody).toContain("Phone: Not provided");
    });

    it("should succeed even if email sending fails", async () => {
      const mockSubmission = {
        id: "submission_123",
        ...validContactData,
        createdAt: new Date(),
      };

      vi.mocked(prisma.contactSubmission.create).mockResolvedValue(mockSubmission as any);
      mockSendNotificationEmail.mockResolvedValue({
        success: false,
        error: "Email service down"
      } as EmailSendResult);

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(validContactData),
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

      expect(mockSendNotificationEmail).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should return 500 for unexpected errors", async () => {
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

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(dataWithEmptyPhone),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ success: true });
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

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(dataWithLongMessage),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ success: true });
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

      const request = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(dataWithSpecialChars),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ success: true });
    });
  });

  describe("email-service integration", () => {
    it("should pass correct tag and metadata to email-service", async () => {
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

      await POST(request as any);

      expect(mockSendNotificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        {
          replyTo: "john@example.com",
          tag: "contact-form",
          metadata: {
            contactName: "John Doe",
            contactEmail: "john@example.com",
            subject: "General Inquiry",
          },
        }
      );
    });

    it("should include replyTo in email options", async () => {
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

      await POST(request as any);

      const callArgs = mockSendNotificationEmail.mock.calls[0];
      const emailOptions = callArgs[2];
      expect(emailOptions?.replyTo).toBe("john@example.com");
    });
  });
});
