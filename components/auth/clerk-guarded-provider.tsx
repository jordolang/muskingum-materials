import { ClerkProvider } from "@clerk/nextjs";

// Clerk is now scoped to the authenticated surfaces only (/admin and the
// hidden /sign-in login). The public marketing site renders no ClerkProvider,
// so it ships zero Clerk client JS.
//
// Preview/CI builds without a real publishable key would otherwise crash with
// "Missing publishableKey", so we only engage ClerkProvider when a real key is
// present — mirroring the guard used in middleware.
const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "your_clerk_publishable_key",
);

export function ClerkGuardedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasClerk) return <>{children}</>;
  return <ClerkProvider>{children}</ClerkProvider>;
}
