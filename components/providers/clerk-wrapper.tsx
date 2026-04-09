import { ClerkProvider } from "@clerk/nextjs";

const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "your_clerk_publishable_key"
);

export function ClerkWrapper({ children }: { children: React.ReactNode }) {
  if (!hasClerk) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
