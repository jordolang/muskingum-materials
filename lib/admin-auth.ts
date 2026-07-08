import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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

  // Check if user has admin role in publicMetadata
  if (user?.publicMetadata?.role !== "admin") {
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

    return user?.publicMetadata?.role === "admin";
  } catch {
    // Clerk not configured or other error
    return false;
  }
}
