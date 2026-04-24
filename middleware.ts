import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIdentifier } from "./lib/rate-limit";
import type { RateLimitTier } from "./lib/rate-limit";
import { logRequest, logResponse } from "./lib/request-logger";

const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "your_clerk_publishable_key"
);

// Map of public API endpoints to their rate limit tiers
const rateLimitedEndpoints: Record<string, RateLimitTier> = {
  "/api/chat": "chat",
  "/api/contact": "contact-quote",
  "/api/quote": "contact-quote",
  "/api/leads": "leads-newsletter",
  "/api/newsletter": "leads-newsletter",
};

export default async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  // Log incoming request
  logRequest(request);

  // Check if this is a rate-limited public API endpoint
  const rateLimitTier = rateLimitedEndpoints[pathname];
  if (rateLimitTier) {
    const identifier = getClientIdentifier(request);
    const result = await checkRateLimit(identifier, rateLimitTier);

    if (!result.success) {
      // Calculate Retry-After in seconds
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

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

  if (hasClerk) {
    const { clerkMiddleware } = await import("@clerk/nextjs/server");
    const handler = clerkMiddleware();
    const response = (await handler(request, {} as never)) ?? NextResponse.next();
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
