import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AccountSidebar } from "@/components/account/sidebar";
import { ErrorBoundary } from "@/components/error-boundary";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.userId ?? null;
  } catch {
    // Clerk not configured
  }

  if (!userId) {
    redirect("/sign-in?redirect_url=/account");
  }

  return (
    <div className="py-8">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <AccountSidebar />
          </aside>
          <main className="lg:col-span-3">
            <ErrorBoundary componentName="AccountDashboard">
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}
