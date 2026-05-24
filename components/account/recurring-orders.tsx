import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

const ORDERS_PER_PAGE = 10;

interface RecurringOrdersProps {
  page?: number;
}

export default async function RecurringOrders({ page = 1 }: RecurringOrdersProps) {
  const session = await auth();
  const currentPage = Math.max(1, page);

  let recurringOrders: Array<{
    id: string;
    name: string;
    email: string;
    company: string | null;
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
        orderBy: { nextDeliveryDate: "asc" },
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
            Manage your recurring deliveries
          </p>
        </div>
        <Link href="/order/recurring/new">
          <Button className="gap-2">
            <RotateCw className="h-4 w-4" />
            New Recurring Order
          </Button>
        </Link>
      </div>

      {recurringOrders.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <RotateCw className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No recurring orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Set up a recurring order to get regular deliveries on your schedule.
            </p>
            <Link href="/order/recurring/new">
              <Button>Create Recurring Order</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {recurringOrders.map((order) => {
              const items = order.items as Array<{ name: string; quantity: number; unit: string }>;
              const isActive = order.status === "active";
              const nextDelivery = new Date(order.nextDeliveryDate);
              const isPastDue = nextDelivery < new Date() && isActive;

              return (
                <Link key={order.id} href={`/account/recurring-orders/${order.id}`}>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {order.company && (
                              <p className="font-bold text-sm">{order.company}</p>
                            )}
                            <StatusBadge status={order.status} />
                            <FrequencyBadge frequency={order.frequency} />
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {items.map((i) => `${i.name} (${i.quantity} ${i.unit}${i.quantity !== 1 ? "s" : ""})`).join(", ")}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className={`text-xs font-medium ${isPastDue ? "text-red-600" : "text-muted-foreground"}`}>
                              Next delivery: {nextDelivery.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                              {isPastDue && " (Past due)"}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Delivery to: {truncateAddress(order.deliveryAddress)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ORDERS_PER_PAGE) + 1} to {Math.min(currentPage * ORDERS_PER_PAGE, totalOrders)} of {totalOrders} recurring orders
              </p>
              <div className="flex gap-2">
                <Link href={`?page=${currentPage - 1}`}>
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
                <Link href={`?page=${currentPage + 1}`}>
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
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

function FrequencyBadge({ frequency }: { frequency: string }) {
  return (
    <Badge variant="outline" className="text-xs capitalize">
      {frequency}
    </Badge>
  );
}

function truncateAddress(address: string): string {
  const maxLength = 50;
  if (address.length <= maxLength) {
    return address;
  }
  return `${address.substring(0, maxLength)}...`;
}
