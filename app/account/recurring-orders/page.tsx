import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { RefreshCw, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { RecurringOrdersClient } from "@/components/account/recurring-orders-client";

const ORDERS_PER_PAGE = 10;

interface RecurringOrdersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function RecurringOrdersPage({ searchParams }: RecurringOrdersPageProps) {
  const session = await auth();
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));

  let recurringOrders: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string | null;
    items: unknown;
    deliveryAddress: string;
    deliveryNotes: string | null;
    frequency: string;
    nextDeliveryDate: Date;
    status: string;
    createdAt: Date;
  }> = [];
  let totalOrders = 0;

  try {
    const skip = (currentPage - 1) * ORDERS_PER_PAGE;

    [recurringOrders, totalOrders] = await Promise.all([
      prisma.recurringOrder.findMany({
        where: { userId: session?.userId ?? undefined },
        orderBy: { createdAt: "desc" },
        take: ORDERS_PER_PAGE,
        skip,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true,
          items: true,
          deliveryAddress: true,
          deliveryNotes: true,
          frequency: true,
          nextDeliveryDate: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.recurringOrder.count({
        where: { userId: session?.userId ?? undefined },
      }),
    ]);
  } catch {
    // DB not ready
  }

  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <div className="space-y-6">
      <RecurringOrdersHeader />

      {recurringOrders.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <RecurringOrdersClient orders={recurringOrders} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ORDERS_PER_PAGE) + 1} to {Math.min(currentPage * ORDERS_PER_PAGE, totalOrders)} of {totalOrders} recurring orders
              </p>
              <div className="flex gap-2">
                <Link href={`/account/recurring-orders?page=${currentPage - 1}`}>
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
                <Link href={`/account/recurring-orders?page=${currentPage + 1}`}>
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

function RecurringOrdersHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold font-heading">Recurring Orders</h1>
        <p className="text-sm text-muted-foreground">
          Manage your recurring delivery schedules
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-12 text-center">
        <RefreshCw className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No recurring orders yet</h2>
        <p className="text-muted-foreground mb-6">
          Set up a recurring delivery schedule for materials you order regularly.
        </p>
      </CardContent>
    </Card>
  );
}
