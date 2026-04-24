import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ReorderButton } from "@/components/account/reorder-button";
import { StatusBadge } from "@/components/order/status-badge";
import { PaymentBadge } from "@/components/order/payment-badge";

const ORDERS_PER_PAGE = 10;

interface OrdersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await auth();
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));

  let orders: Array<{
    id: string;
    orderNumber: string;
    items: unknown;
    total: number;
    status: string;
    paymentStatus: string;
    pickupOrDeliver: string;
    deliveryAddress: string | null;
    createdAt: Date;
  }> = [];
  let totalOrders = 0;

  try {
    const skip = (currentPage - 1) * ORDERS_PER_PAGE;

    [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: { userId: session?.userId ?? undefined },
        orderBy: { createdAt: "desc" },
        take: ORDERS_PER_PAGE,
        skip,
      }),
      prisma.order.count({
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
          <h1 className="text-2xl font-bold font-heading">My Orders</h1>
          <p className="text-sm text-muted-foreground">
            View and track all your orders
          </p>
        </div>
        <Link href="/order">
          <Button className="gap-2">
            <Package className="h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              When you place an order, it will appear here.
            </p>
            <Link href="/order">
              <Button>Place Your First Order</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => {
              const items = order.items as Array<{ name: string; quantity: number; unit: string }>;
              return (
                <Link key={order.id} href={`/account/orders/${order.orderNumber}`}>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold font-mono text-sm">
                              {order.orderNumber}
                            </p>
                            <StatusBadge status={order.status} />
                            <PaymentBadge status={order.paymentStatus} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {items.map((i) => `${i.name} (${i.quantity} ${i.unit}${i.quantity !== 1 ? "s" : ""})`).join(", ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {order.pickupOrDeliver}
                            </p>
                          </div>
                          <ReorderButton
                            orderData={{
                              items,
                              pickupOrDeliver: order.pickupOrDeliver,
                              deliveryAddress: order.deliveryAddress,
                            }}
                          />
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
                Showing {((currentPage - 1) * ORDERS_PER_PAGE) + 1} to {Math.min(currentPage * ORDERS_PER_PAGE, totalOrders)} of {totalOrders} orders
              </p>
              <div className="flex gap-2">
                <Link href={`/account/orders?page=${currentPage - 1}`}>
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
                <Link href={`/account/orders?page=${currentPage + 1}`}>
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
