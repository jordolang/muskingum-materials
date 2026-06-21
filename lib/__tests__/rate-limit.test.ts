import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { RateLimitTier } from "@/lib/rate-limit";

// Set up environment to ensure in-memory fallback is used
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

// Import after clearing env vars to ensure in-memory mode
const { checkRateLimit, getClientIdentifier } = await import("@/lib/rate-limit");

describe("getClientIdentifier", () => {
  it("should extract IP from x-forwarded-for header", () => {
    const request = new Request("http://localhost:3000", {
      headers: {
        "x-forwarded-for": "192.168.1.1, 10.0.0.1",
      },
    });

    const identifier = getClientIdentifier(request);
    expect(identifier).toBe("192.168.1.1");
  });

  it("should handle single IP in x-forwarded-for", () => {
    const request = new Request("http://localhost:3000", {
      headers: {
        "x-forwarded-for": "192.168.1.1",
      },
    });

    const identifier = getClientIdentifier(request);
    expect(identifier).toBe("192.168.1.1");
  });

  it("should trim whitespace from x-forwarded-for IP", () => {
    const request = new Request("http://localhost:3000", {
      headers: {
        "x-forwarded-for": "  192.168.1.1  , 10.0.0.1",
      },
    });

    const identifier = getClientIdentifier(request);
    expect(identifier).toBe("192.168.1.1");
  });

  it("should fallback to x-real-ip header when x-forwarded-for is not present", () => {
    const request = new Request("http://localhost:3000", {
      headers: {
        "x-real-ip": "203.0.113.1",
      },
    });

    const identifier = getClientIdentifier(request);
    expect(identifier).toBe("203.0.113.1");
  });

  it("should prefer x-forwarded-for over x-real-ip", () => {
    const request = new Request("http://localhost:3000", {
      headers: {
        "x-forwarded-for": "192.168.1.1",
        "x-real-ip": "203.0.113.1",
      },
    });

    const identifier = getClientIdentifier(request);
    expect(identifier).toBe("192.168.1.1");
  });

  it("should return 'unknown' when no IP headers are present", () => {
    const request = new Request("http://localhost:3000");

    const identifier = getClientIdentifier(request);
    expect(identifier).toBe("unknown");
  });
});

describe("checkRateLimit - in-memory fallback", () => {
  beforeEach(() => {
    // Ensure Redis is not available for these tests
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("chat tier", () => {
    it("should allow requests within limit (5 per minute)", async () => {
      const identifier = "test-user-1";
      const tier: RateLimitTier = "chat";

      const result = await checkRateLimit(identifier, tier);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it("should track requests and decrement remaining count", async () => {
      const identifier = "test-user-2";
      const tier: RateLimitTier = "chat";

      const result1 = await checkRateLimit(identifier, tier);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = await checkRateLimit(identifier, tier);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(3);

      const result3 = await checkRateLimit(identifier, tier);
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(2);
    });

    it("should reject requests exceeding limit", async () => {
      const identifier = "test-user-3";
      const tier: RateLimitTier = "chat";

      // Make 5 requests (at the limit)
      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimit(identifier, tier);
        expect(result.success).toBe(true);
      }

      // 6th request should fail
      const result = await checkRateLimit(identifier, tier);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should isolate rate limits per identifier", async () => {
      const tier: RateLimitTier = "chat";

      const result1 = await checkRateLimit("user-a", tier);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = await checkRateLimit("user-b", tier);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(4); // Independent counter
    });
  });

  describe("contact-quote tier", () => {
    it("should allow requests within limit (10 per hour)", async () => {
      const identifier = "test-user-4";
      const tier: RateLimitTier = "contact-quote";

      const result = await checkRateLimit(identifier, tier);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(9);
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it("should track requests correctly", async () => {
      const identifier = "test-user-5";
      const tier: RateLimitTier = "contact-quote";

      const result1 = await checkRateLimit(identifier, tier);
      expect(result1.remaining).toBe(9);

      const result2 = await checkRateLimit(identifier, tier);
      expect(result2.remaining).toBe(8);
    });

    it("should reject requests exceeding limit", async () => {
      const identifier = "test-user-6";
      const tier: RateLimitTier = "contact-quote";

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        const result = await checkRateLimit(identifier, tier);
        expect(result.success).toBe(true);
      }

      // 11th request should fail
      const result = await checkRateLimit(identifier, tier);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("leads-newsletter tier", () => {
    it("should allow requests within limit (20 per hour)", async () => {
      const identifier = "test-user-7";
      const tier: RateLimitTier = "leads-newsletter";

      const result = await checkRateLimit(identifier, tier);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(20);
      expect(result.remaining).toBe(19);
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it("should track requests correctly", async () => {
      const identifier = "test-user-8";
      const tier: RateLimitTier = "leads-newsletter";

      const result1 = await checkRateLimit(identifier, tier);
      expect(result1.remaining).toBe(19);

      const result2 = await checkRateLimit(identifier, tier);
      expect(result2.remaining).toBe(18);
    });

    it("should reject requests exceeding limit", async () => {
      const identifier = "test-user-9";
      const tier: RateLimitTier = "leads-newsletter";

      // Make 20 requests
      for (let i = 0; i < 20; i++) {
        const result = await checkRateLimit(identifier, tier);
        expect(result.success).toBe(true);
      }

      // 21st request should fail
      const result = await checkRateLimit(identifier, tier);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("tier isolation", () => {
    it("should maintain separate limits for different tiers", async () => {
      const identifier = "test-user-10";

      const chatResult = await checkRateLimit(identifier, "chat");
      expect(chatResult.success).toBe(true);
      expect(chatResult.remaining).toBe(4);

      const contactResult = await checkRateLimit(identifier, "contact-quote");
      expect(contactResult.success).toBe(true);
      expect(contactResult.remaining).toBe(9); // Separate counter

      const leadsResult = await checkRateLimit(identifier, "leads-newsletter");
      expect(leadsResult.success).toBe(true);
      expect(leadsResult.remaining).toBe(19); // Separate counter
    });
  });
});

describe("rate limit response format", () => {
  it("should return all required fields in response", async () => {
    const result = await checkRateLimit("test-user", "chat");

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("limit");
    expect(result).toHaveProperty("remaining");
    expect(result).toHaveProperty("reset");
    expect(typeof result.success).toBe("boolean");
    expect(typeof result.limit).toBe("number");
    expect(typeof result.remaining).toBe("number");
    expect(typeof result.reset).toBe("number");
  });

  it("should include valid reset timestamp in milliseconds", async () => {
    const now = Date.now();
    const result = await checkRateLimit("test-user", "chat");

    expect(result.reset).toBeGreaterThan(now);
    // Reset should be within reasonable range (1 hour for most tiers)
    expect(result.reset).toBeLessThan(now + 60 * 60 * 1000 + 1000);
  });

  it("should have remaining count less than or equal to limit", async () => {
    const result = await checkRateLimit("test-user", "chat");

    expect(result.remaining).toBeLessThanOrEqual(result.limit);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });
});

describe("InMemoryStore behavior", () => {
  it("should reset counter after time window expires", async () => {
    const identifier = "test-user-expiry";
    const tier: RateLimitTier = "chat";

    // Make a request
    const result1 = await checkRateLimit(identifier, tier);
    expect(result1.remaining).toBe(4);

    // Fast-forward time by mocking Date.now
    const originalDateNow = Date.now;
    const fixedTime = originalDateNow();
    vi.spyOn(Date, "now").mockImplementation(() => fixedTime + 61000); // 61 seconds later

    // After window expires, counter should reset
    const result2 = await checkRateLimit(identifier, tier);
    expect(result2.remaining).toBe(4); // Reset to initial state

    // Restore Date.now
    vi.spyOn(Date, "now").mockImplementation(originalDateNow);
  });

  it("should maintain counter within time window", async () => {
    const identifier = "test-user-window";
    const tier: RateLimitTier = "chat";

    const result1 = await checkRateLimit(identifier, tier);
    expect(result1.remaining).toBe(4);

    // Small time advancement (within window)
    const originalDateNow = Date.now;
    const fixedTime = originalDateNow();
    vi.spyOn(Date, "now").mockImplementation(() => fixedTime + 5000); // 5 seconds later

    const result2 = await checkRateLimit(identifier, tier);
    expect(result2.remaining).toBe(3); // Counter continues

    // Restore Date.now
    vi.spyOn(Date, "now").mockImplementation(originalDateNow);
  });
});
