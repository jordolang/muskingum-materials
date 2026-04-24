import { auth, currentUser } from "@clerk/nextjs/server";
import { Mail, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const SUBSCRIBERS_PER_PAGE = 20;

interface SubscribersPageProps {
  searchParams: Promise<{ page?: string; filter?: string }>;
}

export default async function SubscribersPage({ searchParams }: SubscribersPageProps) {
  const user = await currentUser();

  // Check if user is admin
  if (!user || user.publicMetadata.role !== "admin") {
    redirect("/account");
  }

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const filter = params.filter || "all"; // all, active, unsubscribed

  let subscribers: Array<{
    id: string;
    email: string;
    name: string | null;
    active: boolean;
    createdAt: Date;
  }> = [];
  let totalSubscribers = 0;
  let activeCount = 0;
  let inactiveCount = 0;

  try {
    const skip = (currentPage - 1) * SUBSCRIBERS_PER_PAGE;

    // Build where clause based on filter
    const whereClause = filter === "active"
      ? { active: true }
      : filter === "unsubscribed"
      ? { active: false }
      : {};

    [subscribers, totalSubscribers, activeCount, inactiveCount] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: SUBSCRIBERS_PER_PAGE,
        skip,
        select: {
          id: true,
          email: true,
          name: true,
          active: true,
          createdAt: true,
        },
      }),
      prisma.newsletterSubscriber.count({ where: whereClause }),
      prisma.newsletterSubscriber.count({ where: { active: true } }),
      prisma.newsletterSubscriber.count({ where: { active: false } }),
    ]);
  } catch {
    // DB not ready
  }

  const totalPages = Math.ceil(totalSubscribers / SUBSCRIBERS_PER_PAGE);
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Newsletter Subscribers</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your email subscribers
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b">
        <Link href="/account/admin/subscribers?filter=all">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            className="rounded-b-none"
          >
            All ({activeCount + inactiveCount})
          </Button>
        </Link>
        <Link href="/account/admin/subscribers?filter=active">
          <Button
            variant={filter === "active" ? "default" : "ghost"}
            size="sm"
            className="rounded-b-none"
          >
            Active ({activeCount})
          </Button>
        </Link>
        <Link href="/account/admin/subscribers?filter=unsubscribed">
          <Button
            variant={filter === "unsubscribed" ? "default" : "ghost"}
            size="sm"
            className="rounded-b-none"
          >
            Unsubscribed ({inactiveCount})
          </Button>
        </Link>
      </div>

      {subscribers.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {filter === "all"
                ? "No subscribers yet"
                : filter === "active"
                ? "No active subscribers"
                : "No unsubscribed users"}
            </h2>
            <p className="text-muted-foreground">
              {filter === "all"
                ? "Subscribers will appear here as they sign up for your newsletter."
                : filter === "active"
                ? "No active subscribers found."
                : "No unsubscribed users found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {subscribers.map((subscriber) => {
              return (
                <Card key={subscriber.id} className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="font-bold text-sm">
                            {subscriber.email}
                          </p>
                          <StatusBadge active={subscriber.active} />
                        </div>
                        {subscriber.name && (
                          <p className="text-sm text-muted-foreground mb-1 ml-6">
                            {subscriber.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground ml-6">
                          Subscribed {new Date(subscriber.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * SUBSCRIBERS_PER_PAGE) + 1} to {Math.min(currentPage * SUBSCRIBERS_PER_PAGE, totalSubscribers)} of {totalSubscribers} subscribers
              </p>
              <div className="flex gap-2">
                <Link href={`/account/admin/subscribers?page=${currentPage - 1}${filter !== "all" ? `&filter=${filter}` : ""}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPrevPage}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                </Link>
                <div className="flex items-center gap-2 px-3">
                  <span className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <Link href={`/account/admin/subscribers?page=${currentPage + 1}${filter !== "all" ? `&filter=${filter}` : ""}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNextPage}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return <Badge variant="default" className="text-xs bg-green-600">Active</Badge>;
  }
  return <Badge variant="outline" className="text-xs text-gray-600">Unsubscribed</Badge>;
}
