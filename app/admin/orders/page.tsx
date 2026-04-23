import Link from "next/link";
import { ArrowRight, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { OrdersFilters } from "./orders-filters";

const ORDERS_PER_PAGE = 10;

interface AdminOrdersPageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const searchQuery = params.search || "";
  const statusFilter = params.status || "all";

  let orders: Array<{
    id: string;
    orderNumber: string;
    items: unknown;
    total: number;
    status: string;
    paymentStatus: string;
    pickupOrDeliver: string;
    createdAt: Date;
    name: string;
    email: string;
    phone: string | null;
    userId: string | null;
  }> = [];
  let totalOrders = 0;

  try {
    const skip = (currentPage - 1) * ORDERS_PER_PAGE;

    // Build where clause for search and filter
    const where: {
      status?: string;
      OR?: Array<{
        orderNumber?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
        name?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    // Status filter
    if (statusFilter !== "all") {
      where.status = statusFilter;
    }

    // Search filter
    if (searchQuery) {
      where.OR = [
        { orderNumber: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
        { name: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: ORDERS_PER_PAGE,
        skip,
      }),
      prisma.order.count({ where }),
    ]);
  } catch {
    // DB not ready
  }

  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  // Build query params for links
  const buildQueryString = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const page = overrides.page || currentPage.toString();
    const search = overrides.search !== undefined ? overrides.search : searchQuery;
    const status = overrides.status !== undefined ? overrides.status : statusFilter;

    if (page !== "1") params.set("page", page);
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Orders</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all customer orders
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <OrdersFilters />

      {orders.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders found</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Orders will appear here when customers place them."}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <Link href="/admin/orders">
                <Button variant="outline">Clear Filters</Button>
              </Link>
            )}
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                          <p className="text-sm font-medium mt-1">
                            {order.name}
                            <span className="text-muted-foreground text-xs ml-2">
                              {order.email}
                            </span>
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
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ORDERS_PER_PAGE) + 1} to {Math.min(currentPage * ORDERS_PER_PAGE, totalOrders)} of {totalOrders} orders
              </p>
              <div className="flex gap-2">
                <Link href={`/admin/orders${buildQueryString({ page: (currentPage - 1).toString() })}`}>
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
                <Link href={`/admin/orders${buildQueryString({ page: (currentPage + 1).toString() })}`}>
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
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    ready: "bg-green-100 text-green-800",
    completed: "bg-green-100 text-green-800",
    canceled: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  if (status === "paid") {
    return <Badge variant="default" className="text-xs bg-green-600">Paid</Badge>;
  }
  if (status === "unpaid") {
    return <Badge variant="outline" className="text-xs">Unpaid</Badge>;
  }
  return null;
}
