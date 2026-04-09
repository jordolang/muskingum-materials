import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory store for rate limiting when Redis is not available
class InMemoryStore {
  private store: Map<string, { count: number; reset: number }> = new Map();

  async get(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;

    if (Date.now() > entry.reset) {
      this.store.delete(key);
      return 0;
    }

    return entry.count;
  }

  async set(key: string, count: number, windowMs: number): Promise<void> {
    this.store.set(key, {
      count,
      reset: Date.now() + windowMs,
    });
  }

  async increment(key: string, windowMs: number): Promise<number> {
    const current = await this.get(key);
    const newCount = current + 1;
    await this.set(key, newCount, windowMs);
    return newCount;
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.store.forEach((entry, key) => {
      if (now > entry.reset) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.store.delete(key));
  }
}

const inMemoryStore = new InMemoryStore();

// Clean up expired entries every 60 seconds
if (typeof window === "undefined") {
  setInterval(() => inMemoryStore.cleanup(), 60000);
}

// Redis client - only initialize if environment variables are set
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Rate limiter configurations
const chatLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "@ratelimit/chat",
    })
  : null;

const contactQuoteLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: true,
      prefix: "@ratelimit/contact-quote",
    })
  : null;

const leadsNewsletterLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      analytics: true,
      prefix: "@ratelimit/leads-newsletter",
    })
  : null;

// In-memory fallback rate limiting
async function checkInMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const key = `ratelimit:${identifier}`;
  const count = await inMemoryStore.increment(key, windowMs);
  const success = count <= limit;

  return {
    success,
    limit,
    remaining: Math.max(0, limit - count),
    reset: Date.now() + windowMs,
  };
}

export type RateLimitTier = "chat" | "contact-quote" | "leads-newsletter";

export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // Select the appropriate limiter based on tier
  let limiter: Ratelimit | null = null;
  let fallbackLimit = 0;
  let fallbackWindow = 0;

  switch (tier) {
    case "chat":
      limiter = chatLimiter;
      fallbackLimit = 5;
      fallbackWindow = 60 * 1000; // 1 minute
      break;
    case "contact-quote":
      limiter = contactQuoteLimiter;
      fallbackLimit = 10;
      fallbackWindow = 60 * 60 * 1000; // 1 hour
      break;
    case "leads-newsletter":
      limiter = leadsNewsletterLimiter;
      fallbackLimit = 20;
      fallbackWindow = 60 * 60 * 1000; // 1 hour
      break;
  }

  // Use Redis-based rate limiting if available
  if (limiter) {
    try {
      const result = await limiter.limit(identifier);
      // Normalize reset to milliseconds. Upstash documents reset as ms,
      // but guard against Unix-seconds values (10-digit timestamps) to
      // keep Retry-After and X-RateLimit-Reset headers correct.
      const resetMs =
        result.reset < 1e12 ? result.reset * 1000 : result.reset;
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: resetMs,
      };
    } catch (_error) {
      // Fall back to in-memory if Redis fails
      return checkInMemoryRateLimit(
        `${tier}:${identifier}`,
        fallbackLimit,
        fallbackWindow
      );
    }
  }

  // Use in-memory rate limiting as fallback
  return checkInMemoryRateLimit(
    `${tier}:${identifier}`,
    fallbackLimit,
    fallbackWindow
  );
}

export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (for proxied requests)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return "unknown";
}
