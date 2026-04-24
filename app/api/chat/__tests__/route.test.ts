import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/chat/route";
import { prisma } from "@/lib/prisma";
import { generateText } from "ai";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    chatConversation: {
      upsert: vi.fn(),
    },
    chatMessage: {
      createMany: vi.fn(),
    },
  },
}));

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn(() => "mocked-model"),
}));

describe("POST /api/chat", () => {
  const validChatData = {
    message: "What are your hours of operation?",
    visitorId: "visitor_123",
    history: [
      { role: "user" as const, content: "Hello" },
      { role: "assistant" as const, content: "Hi! How can I help you today?" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  describe("successful responses with AI", () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = "test-api-key";
    });

    it("should return AI-generated response when API key is configured", async () => {
      const mockConversation = {
        id: "conv_123",
        visitorId: "visitor_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);
      vi.mocked(generateText).mockResolvedValue({
        text: "We're open Monday through Friday, 7:30 AM to 4:00 PM.",
      } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify(validChatData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        reply: "We're open Monday through Friday, 7:30 AM to 4:00 PM.",
      });
      expect(generateText).toHaveBeenCalledWith({
        model: "mocked-model",
        system: expect.stringContaining("Muskingum Materials"),
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi! How can I help you today?" },
          { role: "user", content: "What are your hours of operation?" },
        ],
        maxOutputTokens: 500,
      });
    });

    it("should handle minimal request with just message", async () => {
      const minimalData = {
        message: "What are your prices?",
      };

      const mockConversation = {
        id: "conv_456",
        visitorId: expect.stringContaining("anon-"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);
      vi.mocked(generateText).mockResolvedValue({
        text: "Our prices vary by product. Fill Dirt is $2.00/ton.",
      } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify(minimalData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toBe("Our prices vary by product. Fill Dirt is $2.00/ton.");
      expect(generateText).toHaveBeenCalledWith({
        model: "mocked-model",
        system: expect.stringContaining("Muskingum Materials"),
        messages: [
          { role: "user", content: "What are your prices?" },
        ],
        maxOutputTokens: 500,
      });
    });

    it("should include conversation history in AI request", async () => {
      const mockConversation = {
        id: "conv_123",
        visitorId: "visitor_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);
      vi.mocked(generateText).mockResolvedValue({
        text: "Yes, we offer delivery up to 20 tons per load.",
      } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify(validChatData),
      });

      await POST(request as any);

      expect(generateText).toHaveBeenCalledWith({
        model: "mocked-model",
        system: expect.any(String),
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi! How can I help you today?" },
          { role: "user", content: "What are your hours of operation?" },
        ],
        maxOutputTokens: 500,
      });
    });
  });

  describe("successful responses with static fallback", () => {
    it("should return static response when API key is not configured", async () => {
      const mockConversation = {
        id: "conv_123",
        visitorId: "visitor_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "What are your hours?",
          visitorId: "visitor_123",
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toContain("Monday through Friday");
      expect(data.reply).toContain("7:30 AM to 4:00 PM");
      expect(generateText).not.toHaveBeenCalled();
    });

    it("should return static price response", async () => {
      const mockConversation = {
        id: "conv_123",
        visitorId: "visitor_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "How much does gravel cost?",
          visitorId: "visitor_123",
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toContain("Bank Run");
      expect(data.reply).toContain("$2.00/ton");
      expect(data.reply).toContain("(740) 319-0183");
    });

    it("should return static delivery response", async () => {
      const mockConversation = {
        id: "conv_123",
        visitorId: "visitor_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Do you deliver?",
          visitorId: "visitor_123",
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toContain("delivery");
      expect(data.reply).toContain("20 tons");
      expect(data.reply).toContain("(740) 319-0183");
    });

    it("should return static location response", async () => {
      const mockConversation = {
        id: "conv_123",
        visitorId: "visitor_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Where are you located?",
          visitorId: "visitor_123",
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toContain("1133 Ellis Dam Rd");
      expect(data.reply).toContain("Zanesville");
      expect(data.reply).toContain("43701");
    });

    it("should return static payment response", async () => {
      const mockConversation = {
        id: "conv_123",
        visitorId: "visitor_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "What payment methods do you accept?",
          visitorId: "visitor_123",
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toContain("Visa");
      expect(data.reply).toContain("cash");
      expect(data.reply).toContain("4.5%");
    });

    it("should return default static response for unknown questions", async () => {
      const mockConversation = {
        id: "conv_123",
        visitorId: "visitor_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Tell me about your company history",
          visitorId: "visitor_123",
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toContain("(740) 319-0183");
      expect(data.reply).toContain("sales@muskingummaterials.com");
    });
  });

  describe("database persistence", () => {
    it("should save conversation and messages to database", async () => {
      const mockConversation = {
        id: "conv_123",
        visitorId: "visitor_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify(validChatData),
      });

      await POST(request as any);

      expect(prisma.chatConversation.upsert).toHaveBeenCalledWith({
        where: { visitorId: "visitor_123" },
        update: { updatedAt: expect.any(Date) },
        create: { visitorId: "visitor_123" },
      });
      expect(prisma.chatMessage.createMany).toHaveBeenCalledWith({
        data: [
          {
            conversationId: "conv_123",
            role: "user",
            content: "What are your hours of operation?",
          },
          {
            conversationId: "conv_123",
            role: "assistant",
            content: expect.any(String),
          },
        ],
      });
    });

    it("should generate anonymous visitorId when not provided", async () => {
      const mockConversation = {
        id: "conv_456",
        visitorId: "anon-generated-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Hello",
        }),
      });

      await POST(request as any);

      expect(prisma.chatConversation.upsert).toHaveBeenCalledWith({
        where: { visitorId: expect.stringContaining("anon-") },
        update: { updatedAt: expect.any(Date) },
        create: { visitorId: expect.stringContaining("anon-") },
      });
    });

    it("should succeed even if database save fails", async () => {
      process.env.ANTHROPIC_API_KEY = "test-api-key";

      vi.mocked(prisma.chatConversation.upsert).mockRejectedValue(
        new Error("Database connection failed")
      );
      vi.mocked(generateText).mockResolvedValue({
        text: "We're open Monday through Friday.",
      } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify(validChatData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toBe("We're open Monday through Friday.");
    });
  });

  describe("validation errors", () => {
    it("should return 400 for missing message", async () => {
      const invalidData = {
        visitorId: "visitor_123",
      };

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
      expect(data.details).toBeDefined();
      expect(prisma.chatConversation.upsert).not.toHaveBeenCalled();
    });

    it("should return 400 for empty message", async () => {
      const invalidData = {
        message: "",
        visitorId: "visitor_123",
      };

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
      expect(data.details).toBeDefined();
      expect(prisma.chatConversation.upsert).not.toHaveBeenCalled();
    });

    it("should return 400 for message exceeding max length", async () => {
      const invalidData = {
        message: "A".repeat(5001),
        visitorId: "visitor_123",
      };

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
      expect(data.details).toBeDefined();
      expect(prisma.chatConversation.upsert).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid visitorId", async () => {
      const invalidData = {
        message: "Hello",
        visitorId: "A".repeat(101),
      };

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
      expect(data.details).toBeDefined();
      expect(prisma.chatConversation.upsert).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid history structure", async () => {
      const invalidData = {
        message: "Hello",
        visitorId: "visitor_123",
        history: [
          { role: "invalid_role", content: "Test" },
        ],
      };

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
      expect(data.details).toBeDefined();
      expect(prisma.chatConversation.upsert).not.toHaveBeenCalled();
    });

    it("should return 400 for history exceeding max length", async () => {
      const history = Array.from({ length: 51 }, (_, i) => ({
        role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
        content: "Message",
      }));

      const invalidData = {
        message: "Hello",
        visitorId: "visitor_123",
        history,
      };

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
      expect(data.details).toBeDefined();
      expect(prisma.chatConversation.upsert).not.toHaveBeenCalled();
    });

    it("should return 400 for history message exceeding max length", async () => {
      const invalidData = {
        message: "Hello",
        visitorId: "visitor_123",
        history: [
          { role: "user" as const, content: "A".repeat(5001) },
        ],
      };

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
      expect(data.details).toBeDefined();
      expect(prisma.chatConversation.upsert).not.toHaveBeenCalled();
    });
  });

  describe("AI error handling", () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = "test-api-key";
    });

    it("should return friendly error message when AI fails", async () => {
      vi.mocked(generateText).mockRejectedValue(new Error("API rate limit exceeded"));

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify(validChatData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toContain("I'm having trouble right now");
      expect(data.reply).toContain("(740) 319-0183");
    });
  });

  describe("error handling", () => {
    it("should handle malformed JSON request body", async () => {
      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: "not valid json{",
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toContain("I'm having trouble right now");
      expect(data.reply).toContain("(740) 319-0183");
    });

    it("should handle unexpected errors gracefully", async () => {
      process.env.ANTHROPIC_API_KEY = "test-api-key";

      vi.mocked(generateText).mockImplementation(() => {
        throw new TypeError("Unexpected error");
      });

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify(validChatData),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toContain("I'm having trouble right now");
    });
  });

  describe("edge cases", () => {
    it("should handle empty history array", async () => {
      const mockConversation = {
        id: "conv_123",
        visitorId: "visitor_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Hello",
          visitorId: "visitor_123",
          history: [],
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toBeDefined();
    });

    it("should handle special characters in message", async () => {
      const mockConversation = {
        id: "conv_123",
        visitorId: "visitor_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "What's the cost of #57 gravel & fill dirt?\n<script>alert('test')</script>",
          visitorId: "visitor_123",
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toBeDefined();
    });

    it("should handle maximum allowed message length", async () => {
      const mockConversation = {
        id: "conv_123",
        visitorId: "visitor_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "A".repeat(5000),
          visitorId: "visitor_123",
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toBeDefined();
    });

    it("should handle maximum allowed history length", async () => {
      const history = Array.from({ length: 50 }, (_, i) => ({
        role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
        content: "Message",
      }));

      const mockConversation = {
        id: "conv_123",
        visitorId: "visitor_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Hello",
          visitorId: "visitor_123",
          history,
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toBeDefined();
    });

    it("should handle maximum allowed visitorId length", async () => {
      const mockConversation = {
        id: "conv_123",
        visitorId: "A".repeat(100),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.chatConversation.upsert).mockResolvedValue(mockConversation as any);
      vi.mocked(prisma.chatMessage.createMany).mockResolvedValue({ count: 2 } as any);

      const request = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Hello",
          visitorId: "A".repeat(100),
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reply).toBeDefined();
    });
  });
});
