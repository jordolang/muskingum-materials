import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "your_clerk_publishable_key"
);

export default async function middleware(request: NextRequest) {
  if (hasClerk) {
    const { clerkMiddleware } = await import("@clerk/nextjs/server");
    const handler = clerkMiddleware();
    return handler(request, {} as never);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|images|videos|favicon.ico|studio|api/chat|api/contact|api/leads|api/quote|api/newsletter).*)",
  ],
};
