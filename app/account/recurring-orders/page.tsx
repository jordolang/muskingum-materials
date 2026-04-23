import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, RefreshCw, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

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
    items: unknown;
    deliveryAddress: string;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Recurring Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage your recurring delivery schedules
          </p>
        </div>
        <Link href="/order?recurring=true">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Recurring Order
          </Button>
        </Link>
      </div>

      {recurringOrders.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <RefreshCw className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No recurring orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Set up a recurring delivery schedule for materials you order regularly.
            </p>
            <Link href="/order?recurring=true">
              <Button>Create Recurring Order</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {recurringOrders.map((order) => {
              const items = order.items as Array<{ name: string; quantity: number; unit: string }>;
              return (
                <Card key={order.id} className="border-0 shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-sm">
                            {order.name}
                          </p>
                          <StatusBadge status={order.status} />
                          <FrequencyBadge frequency={order.frequency} />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {items.map((i) => `${i.name} (${i.quantity} ${i.unit}${i.quantity !== 1 ? "s" : ""})`).join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Deliver to: {order.deliveryAddress.split('\n')[0]}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Next Delivery</p>
                          <p className="text-sm font-semibold">
                            {new Date(order.nextDeliveryDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    canceled: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

function FrequencyBadge({ frequency }: { frequency: string }) {
  const map: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Bi-Weekly",
    monthly: "Monthly",
  };
  return (
    <Badge variant="outline" className="text-xs">
      {map[frequency] || frequency}
    </Badge>
  );
}
