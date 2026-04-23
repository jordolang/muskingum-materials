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
  let session;
  let user;

  try {
    session = await auth();
    user = await currentUser();
  } catch {
    // Clerk not configured
    redirect("/sign-in?redirect_url=/admin");
  }

  if (!session?.userId) {
    redirect("/sign-in?redirect_url=/admin");
  }

  // Check if user has admin role in publicMetadata
  const isAdmin = user?.publicMetadata?.role === "admin";

  if (!isAdmin) {
    // User is authenticated but not an admin
    throw new Error("Unauthorized: Admin access required");
  }

  return session.userId;
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
