import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIdentifier } from "./lib/rate-limit";
import type { RateLimitTier } from "./lib/rate-limit";
import { logRequest, logResponse } from "./lib/request-logger";
import { logger } from "./lib/logger";

const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "your_clerk_publishable_key"
);

// Map of public API endpoints to their rate limit tiers
const rateLimitedEndpoints: Record<string, RateLimitTier> = {
  "/api/chat": "chat",
  "/api/contact": "contact-quote",
  "/api/quote": "contact-quote",
  "/api/orders/checkout": "contact-quote",
  "/api/leads": "leads-newsletter",
  "/api/newsletter": "leads-newsletter",
};

// FNV-1a hash so we never log raw client IPs to monitoring (PII).
// Stable per-IP for correlation, irreversible.
function hashIdentifier(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export default async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  // Log incoming request
  logRequest(request);

  // Check if this is a rate-limited public API endpoint
  const rateLimitTier = rateLimitedEndpoints[pathname];
  if (rateLimitTier) {
    const identifier = getClientIdentifier(request);

    // When proxy headers are missing, every caller would share the literal
    // "unknown" bucket and a few abusers could 429 every legitimate buyer.
    // Skip rate limiting in that degenerate case but log a warning so ops
    // can investigate the missing-header configuration.
    if (identifier === "unknown") {
      logger.warn("Rate limit skipped: client identifier unavailable", {
        endpoint: pathname,
        tier: rateLimitTier,
      });
    } else {
      const result = await checkRateLimit(identifier, rateLimitTier);

      if (!result.success) {
        // Hash the identifier so we don't ship raw IPs to monitoring (PII).
        // Use warn (not error) — 429s are expected abuse-prevention signals,
        // not exceptions, and shouldn't drown out real failures in Sentry.
        logger.warn("Rate limit exceeded", {
          endpoint: pathname,
          identifierHash: hashIdentifier(identifier),
          tier: rateLimitTier,
          limit: result.limit,
          resetAt: new Date(result.reset).toISOString(),
        });

        // Clamp to >= 1s — clock skew or processing delay can otherwise
        // surface 0 or negative values that some clients mishandle.
        const retryAfter = Math.max(
          1,
          Math.ceil((result.reset - Date.now()) / 1000),
        );

        const response = new NextResponse(
          JSON.stringify({
            error: "Too many requests",
            message: "Rate limit exceeded. Please try again later.",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": retryAfter.toString(),
              "X-RateLimit-Limit": result.limit.toString(),
              "X-RateLimit-Remaining": result.remaining.toString(),
              "X-RateLimit-Reset": result.reset.toString(),
            },
          }
        );

        const duration = Date.now() - startTime;
        logResponse(request, response, duration, { rateLimited: true });

        return response;
      }
    }
  }

  // Clerk is scoped to the authenticated surfaces only (/admin, admin APIs,
  // and the hidden /sign-in login). Public marketing routes skip Clerk so we
  // don't pay its middleware latency on every page — this trims TTFB.
  const needsClerk =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/sign-in");

  if (hasClerk && needsClerk) {
    const { clerkMiddleware } = await import("@clerk/nextjs/server");
    const handler = clerkMiddleware();
    const handlerResponse = await handler(request, {} as never);
    const response = (handlerResponse ?? NextResponse.next()) as NextResponse;
    const duration = Date.now() - startTime;
    logResponse(request, response, duration, { clerkAuth: true });
    return response;
  }

  const response = NextResponse.next();
  const duration = Date.now() - startTime;
  logResponse(request, response, duration);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|images|videos|favicon.ico|studio).*)",
  ],
};
