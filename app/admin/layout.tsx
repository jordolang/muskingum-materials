import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { ClerkGuardedProvider } from "@/components/auth/clerk-guarded-provider";

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
  try {
    await requireAdmin();
  } catch (error) {
    // requireAdmin() calls redirect("/sign-in") for unauthenticated visitors.
    // redirect() throws a NEXT_REDIRECT control-flow error that MUST propagate
    // so the navigation actually happens — unstable_rethrow re-throws those
    // (and notFound) while letting the genuine "not an admin" error fall
    // through to the 403 page below.
    unstable_rethrow(error);
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
