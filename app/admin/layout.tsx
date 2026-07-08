import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { ClerkGuardedProvider } from "@/components/auth/clerk-guarded-provider";

// /admin must render per-request so the auth check runs on every visit — never
// statically prerendered into a frozen (unauthenticated) 403 page.
export const dynamic = "force-dynamic";

function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900">403</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-gray-600">
            You don&apos;t have permission to access this area. Admin access is
            required.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No try/catch around auth()/currentUser()/redirect(): each throws Next.js
  // control-flow errors (DYNAMIC_SERVER_USAGE, NEXT_REDIRECT) that MUST
  // propagate. Catching them broke dynamic rendering and swallowed the sign-in
  // redirect, freezing /admin as a static 403 page.
  const { userId } = await auth();
  if (!userId) {
    // Logged out → send to the hidden Clerk login, then back to /admin.
    redirect("/sign-in?redirect_url=/admin");
  }

  const user = await currentUser();
  if (!isAdminUser(user)) {
    return <UnauthorizedPage />;
  }

  return (
    <ClerkGuardedProvider>
      <div className="py-8">
        <div className="container">
        <div className="grid gap-8 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
          {/* Sidebar - hidden on mobile, shown on md+ */}
          <aside className="hidden md:block">
            <div className="sticky top-8">
              <AdminSidebar />
            </div>
          </aside>

          {/* Mobile sidebar - shown on mobile only */}
          <div className="md:hidden mb-6">
            <AdminSidebar />
          </div>

          {/* Main content */}
          <main>{children}</main>
        </div>
        </div>
      </div>
    </ClerkGuardedProvider>
  );
}
