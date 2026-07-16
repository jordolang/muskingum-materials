import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import middleware from "./middleware";
import * as rateLimit from "./lib/rate-limit";
import * as requestLogger from "./lib/request-logger";
import { logger } from "./lib/logger";

// Mock dependencies
vi.mock("./lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  getClientIdentifier: vi.fn(),
}));

vi.mock("./lib/request-logger", () => ({
  logRequest: vi.fn(),
  logResponse: vi.fn(),
}));

vi.mock("./lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock Clerk middleware
vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: vi.fn(),
}));

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("rate limiting for public API endpoints", () => {
    it("should apply rate limiting to /api/chat endpoint", async () => {
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/chat"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() + 60000,
      });

      const response = await middleware(mockRequest);

      expect(rateLimit.getClientIdentifier).toHaveBeenCalledWith(mockRequest);
      expect(rateLimit.checkRateLimit).toHaveBeenCalledWith("192.168.1.1", "chat");
      expect(response.status).not.toBe(429);
    });

    it("should apply rate limiting to /api/contact endpoint", async () => {
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/contact"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 3600000,
      });

      const response = await middleware(mockRequest);

      expect(rateLimit.checkRateLimit).toHaveBeenCalledWith("192.168.1.1", "contact-quote");
      expect(response.status).not.toBe(429);
    });

    it("should apply rate limiting to /api/quote endpoint", async () => {
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/quote"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 3600000,
      });

      const response = await middleware(mockRequest);

      expect(rateLimit.checkRateLimit).toHaveBeenCalledWith("192.168.1.1", "contact-quote");
      expect(response.status).not.toBe(429);
    });

    it("should apply rate limiting to /api/leads endpoint", async () => {
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/leads"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: true,
        limit: 20,
        remaining: 19,
        reset: Date.now() + 3600000,
      });

      const response = await middleware(mockRequest);

      expect(rateLimit.checkRateLimit).toHaveBeenCalledWith("192.168.1.1", "leads-newsletter");
      expect(response.status).not.toBe(429);
    });

    it("should apply rate limiting to /api/newsletter endpoint", async () => {
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/newsletter"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: true,
        limit: 20,
        remaining: 19,
        reset: Date.now() + 3600000,
      });

      const response = await middleware(mockRequest);

      expect(rateLimit.checkRateLimit).toHaveBeenCalledWith("192.168.1.1", "leads-newsletter");
      expect(response.status).not.toBe(429);
    });

    it("should return 429 when rate limit is exceeded", async () => {
      const resetTime = Date.now() + 60000;
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/chat"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: resetTime,
      });

      const response = await middleware(mockRequest);

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data).toEqual({
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
      });
    });

    it("should include proper headers on 429 response", async () => {
      const resetTime = Date.now() + 60000;
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/chat"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: resetTime,
      });

      const response = await middleware(mockRequest);

      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("Retry-After")).toBeTruthy();
      expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response.headers.get("X-RateLimit-Reset")).toBe(resetTime.toString());
    });

    it("should clamp Retry-After to minimum 1 second", async () => {
      // Set reset time to past to test clamping
      const resetTime = Date.now() - 1000;
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/chat"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: resetTime,
      });

      const response = await middleware(mockRequest);

      const retryAfter = parseInt(response.headers.get("Retry-After") || "0", 10);
      expect(retryAfter).toBeGreaterThanOrEqual(1);
    });

    it("should skip rate limiting when identifier is 'unknown'", async () => {
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/chat"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("unknown");

      const response = await middleware(mockRequest);

      expect(rateLimit.checkRateLimit).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        "Rate limit skipped: client identifier unavailable",
        {
          endpoint: "/api/chat",
          tier: "chat",
        }
      );
      expect(response.status).not.toBe(429);
    });

    it("should log warning when rate limit is exceeded", async () => {
      const resetTime = Date.now() + 60000;
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/chat"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: resetTime,
      });

      await middleware(mockRequest);

      expect(logger.warn).toHaveBeenCalledWith(
        "Rate limit exceeded",
        expect.objectContaining({
          endpoint: "/api/chat",
          identifierHash: expect.any(String),
          tier: "chat",
          limit: 5,
          resetAt: expect.any(String),
        })
      );
    });

    it("should not apply rate limiting to non-rate-limited endpoints", async () => {
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/other"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");

      const response = await middleware(mockRequest);

      expect(rateLimit.checkRateLimit).not.toHaveBeenCalled();
      expect(response.status).not.toBe(429);
    });
  });

  describe("request/response logging", () => {
    it("should log incoming request", async () => {
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/chat"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() + 60000,
      });

      await middleware(mockRequest);

      expect(requestLogger.logRequest).toHaveBeenCalledWith(mockRequest);
    });

    it("should log response with rate limiting metadata", async () => {
      const resetTime = Date.now() + 60000;
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/chat"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: resetTime,
      });

      await middleware(mockRequest);

      expect(requestLogger.logResponse).toHaveBeenCalledWith(
        mockRequest,
        expect.any(NextResponse),
        expect.any(Number),
        { rateLimited: true }
      );
    });

    it("should log response without rate limiting metadata for non-rate-limited endpoints", async () => {
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/other"));

      await middleware(mockRequest);

      expect(requestLogger.logResponse).toHaveBeenCalledWith(
        mockRequest,
        expect.any(NextResponse),
        expect.any(Number)
      );
    });
  });

  describe("Clerk integration", () => {
    it("should skip Clerk middleware when not configured", async () => {
      // No NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY set or placeholder value
      const mockRequest = new NextRequest(new URL("http://localhost:3000/protected"));

      const response = await middleware(mockRequest);

      // When Clerk is not configured, middleware returns NextResponse.next()
      expect(response).toBeInstanceOf(NextResponse);
      expect(requestLogger.logResponse).toHaveBeenCalledWith(
        mockRequest,
        expect.any(NextResponse),
        expect.any(Number)
      );
    });

    it("should pass through to next response for non-rate-limited routes", async () => {
      const mockRequest = new NextRequest(new URL("http://localhost:3000/protected"));

      const response = await middleware(mockRequest);

      expect(response).toBeInstanceOf(NextResponse);
      expect(requestLogger.logRequest).toHaveBeenCalledWith(mockRequest);
      expect(requestLogger.logResponse).toHaveBeenCalledWith(
        mockRequest,
        expect.any(NextResponse),
        expect.any(Number)
      );
    });
  });

  describe("combined scenarios", () => {
    it("should return 429 immediately when rate limit is exceeded", async () => {
      const resetTime = Date.now() + 60000;
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/chat"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: resetTime,
      });

      const response = await middleware(mockRequest);

      // Rate limit should reject immediately
      expect(response.status).toBe(429);
      expect(requestLogger.logResponse).toHaveBeenCalledWith(
        mockRequest,
        expect.any(NextResponse),
        expect.any(Number),
        { rateLimited: true }
      );
    });

    it("should handle rate limit success and continue to next response", async () => {
      const mockRequest = new NextRequest(new URL("http://localhost:3000/api/chat"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() + 60000,
      });

      const response = await middleware(mockRequest);

      expect(rateLimit.checkRateLimit).toHaveBeenCalled();
      expect(response.status).not.toBe(429);
      expect(requestLogger.logResponse).toHaveBeenCalledWith(
        mockRequest,
        expect.any(NextResponse),
        expect.any(Number)
      );
    });

    it("should handle multiple different endpoints correctly", async () => {
      // Test chat endpoint
      const chatRequest = new NextRequest(new URL("http://localhost:3000/api/chat"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.1");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() + 60000,
      });

      await middleware(chatRequest);
      expect(rateLimit.checkRateLimit).toHaveBeenCalledWith("192.168.1.1", "chat");

      vi.clearAllMocks();

      // Test newsletter endpoint
      const newsletterRequest = new NextRequest(new URL("http://localhost:3000/api/newsletter"));
      vi.mocked(rateLimit.getClientIdentifier).mockReturnValue("192.168.1.2");
      vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
        success: true,
        limit: 20,
        remaining: 19,
        reset: Date.now() + 3600000,
      });

      await middleware(newsletterRequest);
      expect(rateLimit.checkRateLimit).toHaveBeenCalledWith("192.168.1.2", "leads-newsletter");
    });
  });
});
