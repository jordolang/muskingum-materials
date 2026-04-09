"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function ClerkWrapper({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isConfigured = Boolean(key && key !== "your_clerk_publishable_key");

  if (!isConfigured) {
    return <>{children}</>;
  }

  return <ClerkProvider publishableKey={key}>{children}</ClerkProvider>;
}
