import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIdentifier } from "./lib/rate-limit";
import type { RateLimitTier } from "./lib/rate-limit";

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
  const { pathname } = request.nextUrl;

  // Check if this is a rate-limited public API endpoint
  const rateLimitTier = rateLimitedEndpoints[pathname];
  if (rateLimitTier) {
    const identifier = getClientIdentifier(request);
    const result = await checkRateLimit(identifier, rateLimitTier);

    if (!result.success) {
      // Calculate Retry-After in seconds
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

      return new NextResponse(
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
    }
  }

  if (hasClerk) {
    const { clerkMiddleware } = await import("@clerk/nextjs/server");
    const handler = clerkMiddleware();
    return handler(request, {} as never);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|images|videos|favicon.ico|studio).*)",
  ],
};
