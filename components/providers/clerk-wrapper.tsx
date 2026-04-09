import { ClerkProvider } from "@clerk/nextjs";

const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isConfigured = Boolean(key && key !== "your_clerk_publishable_key");

export function ClerkWrapper({ children }: { children: React.ReactNode }) {
  if (!isConfigured) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
