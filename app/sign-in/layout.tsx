import { ClerkGuardedProvider } from "@/components/auth/clerk-guarded-provider";

// The sign-in page renders Clerk's <SignIn/> (a client component), so this
// subtree needs a ClerkProvider ancestor. It lives here — not in the root
// layout — so the public site stays Clerk-free. This route is intentionally
// unlinked from all navigation; admins reach it only by visiting /admin.
export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkGuardedProvider>{children}</ClerkGuardedProvider>;
}
