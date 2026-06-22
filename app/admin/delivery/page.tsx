import Link from "next/link";
import { Calendar, Settings, ChevronLeft, ChevronRight, Truck, Package, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

interface AdminDeliveryPageProps {
  searchParams: Promise<{
    date?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function AdminDeliveryPage({
  searchParams,
}: AdminDeliveryPageProps) {
  const params = await searchParams;

  // Default to showing deliveries for the next 14 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const defaultEndDate = new Date(today);
  defaultEndDate.setDate(defaultEndDate.getDate() + 14);

  const startDate = params.startDate
    ? new Date(params.startDate)
    : today;
  const endDate = params.endDate
    ? new Date(params.endDate)
    : defaultEndDate;

  // Fetch orders with scheduled deliveries
  let scheduledOrders: Array<{
    id: string;
    orderNumber: string;
    name: string;
    email: string;
    phone: string | null;
    items: unknown;
    total: number;
    status: string;
    deliveryDate: Date | null;
    deliveryTimeWindow: string | null;
    deliveryAddress: string | null;
    createdAt: Date;
  }> = [];

  let deliveryConfig: {
    timeWindows: unknown;
  } | null = null;

  try {
    [scheduledOrders, deliveryConfig] = await Promise.all([
      prisma.order.findMany({
        where: {
          deliveryDate: {
            gte: startDate,
            lte: endDate,
          },
          pickupOrDeliver: "delivery",
        },
        orderBy: [{ deliveryDate: "asc" }, { deliveryTimeWindow: "asc" }],
        select: {
          id: true,
          orderNumber: true,
          name: true,
          email: true,
          phone: true,
          items: true,
          total: true,
          status: true,
          deliveryDate: true,
          deliveryTimeWindow: true,
          deliveryAddress: true,
          createdAt: true,
        },
      }),
      prisma.deliveryConfig.findFirst({
        select: {
          timeWindows: true,
        },
      }),
    ]);
  } catch {
    // DB not ready or no config
  }

  // Group orders by date
  const ordersByDate = new Map<string, typeof scheduledOrders>();
  scheduledOrders.forEach((order) => {
    if (!order.deliveryDate) return;

    const dateKey = order.deliveryDate.toISOString().split("T")[0];
    const existing = ordersByDate.get(dateKey) || [];
    ordersByDate.set(dateKey, [...existing, order]);
  });

  // Sort dates
  const sortedDates = Array.from(ordersByDate.keys()).sort();

  // Parse time windows from config
  const timeWindows = (deliveryConfig?.timeWindows as Array<{
    key: string;
    label: string;
  }>) || [
    { key: "morning", label: "Morning (8am-12pm)" },
    { key: "afternoon", label: "Afternoon (12pm-5pm)" },
  ];

  // Helper to get time window label
  const getTimeWindowLabel = (key: string | null) => {
    if (!key) return "Not specified";
    const window = timeWindows.find((w) => w.key === key);
    return window ? window.label : key;
  };

  // Build query string for date filters
  const buildQueryString = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const start = overrides.startDate || startDate.toISOString().split("T")[0];
    const end = overrides.endDate || endDate.toISOString().split("T")[0];

    params.set("startDate", start);
    params.set("endDate", end);

    return `?${params.toString()}`;
  };

  // Calculate previous/next week date ranges
  const prevWeekStart = new Date(startDate);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(endDate);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

  const nextWeekStart = new Date(startDate);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const nextWeekEnd = new Date(endDate);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Delivery Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Scheduled deliveries for{" "}
            {startDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            -{" "}
            {endDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <Link href="/admin/delivery/config">
          <Button className="gap-2">
            <Settings className="h-4 w-4" />
            Configure Delivery
          </Button>
        </Link>
      </div>

      {/* Date Range Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/delivery${buildQueryString({
            startDate: prevWeekStart.toISOString().split("T")[0],
            endDate: prevWeekEnd.toISOString().split("T")[0],
          })}`}
        >
          <Button variant="outline" size="sm" className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Previous Week
          </Button>
        </Link>

        <Link href="/admin/delivery">
          <Button variant="outline" size="sm">
            Today
          </Button>
        </Link>

        <Link
          href={`/admin/delivery${buildQueryString({
            startDate: nextWeekStart.toISOString().split("T")[0],
            endDate: nextWeekEnd.toISOString().split("T")[0],
          })}`}
        >
          <Button variant="outline" size="sm" className="gap-1">
            Next Week
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Deliveries</p>
                <p className="text-2xl font-bold">{scheduledOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days with Deliveries</p>
                <p className="text-2xl font-bold">{sortedDates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Package className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg per Day</p>
                <p className="text-2xl font-bold">
                  {sortedDates.length > 0
                    ? (scheduledOrders.length / sortedDates.length).toFixed(1)
                    : "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries by Date */}
      {sortedDates.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No deliveries scheduled</h2>
            <p className="text-muted-foreground mb-6">
              No deliveries are scheduled in this date range.
            </p>
            <Link href="/admin/orders">
              <Button variant="outline">View All Orders</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const date = new Date(dateKey + "T00:00:00");
            const orders = ordersByDate.get(dateKey) || [];

            return (
              <div key={dateKey} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold font-heading">
                    {date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h2>
                  <Badge variant="secondary">{orders.length} deliveries</Badge>
                </div>

                <div className="space-y-2">
                  {orders.map((order) => {
                    const items = order.items as Array<{
                      name: string;
                      quantity: number;
                      unit: string;
                    }>;

                    return (
                      <Link key={order.id} href={`/admin/orders/${order.id}`}>
                        <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-bold font-mono text-sm">
                                    {order.orderNumber}
                                  </p>
                                  <Badge
                                    variant={
                                      order.status === "completed"
                                        ? "default"
                                        : order.status === "pending"
                                          ? "secondary"
                                          : "outline"
                                    }
                                  >
                                    {order.status}
                                  </Badge>
                                  <Badge variant="outline" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    {getTimeWindowLabel(order.deliveryTimeWindow)}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium">
                                  {order.name}
                                  <span className="text-muted-foreground text-xs ml-2">
                                    {order.email}
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {items
                                    .map(
                                      (i) =>
                                        `${i.name} (${i.quantity} ${i.unit}${i.quantity !== 1 ? "s" : ""})`,
                                    )
                                    .join(", ")}
                                </p>
                                {order.deliveryAddress && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    📍 {order.deliveryAddress}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold">
                                  ${order.total.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
