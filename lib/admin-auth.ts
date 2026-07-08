import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Admins are granted by EITHER Clerk publicMetadata.role === "admin" OR by
 * their primary email being on the allowlist. The allowlist is the union of a
 * built-in default (the owner) and the ADMIN_EMAILS env var (comma-separated),
 * so the owner is never locked out and more admins can be added via env.
 */
const DEFAULT_ADMIN_EMAILS = ["jordolang@gmail.com"];

function getAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ADMIN_EMAILS, ...fromEnv])];
}

export function isAdminUser(
  user: Awaited<ReturnType<typeof currentUser>>,
): boolean {
  if (!user) return false;
  if (user.publicMetadata?.role === "admin") return true;
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  return Boolean(email && getAdminEmails().includes(email));
}

/**
 * Verifies that the current user is authenticated and has admin role.
 * Redirects to sign-in if not authenticated.
 * Throws error if authenticated but not admin.
 *
 * @returns The authenticated admin user's ID
 * @throws Error if user is authenticated but not admin
 */
export async function requireAdmin(): Promise<string> {
  // Call auth()/currentUser()/redirect() at the TOP LEVEL — no try/catch.
  // Each throws a Next.js control-flow error (DYNAMIC_SERVER_USAGE for auth(),
  // NEXT_REDIRECT for redirect()) that MUST propagate. Wrapping them in a
  // try/catch swallowed the dynamic-rendering signal (freezing admin routes as
  // a static 403) and the sign-in redirect.
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/admin");
  }

  const user = await currentUser();

  // Admin by role or by email allowlist (see isAdminUser).
  if (!isAdminUser(user)) {
    // User is authenticated but not an admin
    throw new Error("Unauthorized: Admin access required");
  }

  return userId;
}

/**
 * Checks if the current user is an admin without throwing errors.
 * Useful for conditional rendering in components.
 *
 * @returns true if user is authenticated and has admin role, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const session = await auth();
    const user = await currentUser();

    if (!session?.userId) {
      return false;
    }

    return isAdminUser(user);
  } catch {
    // Clerk not configured or other error
    return false;
  }
}
