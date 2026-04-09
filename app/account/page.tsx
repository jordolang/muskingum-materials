import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  ArrowRight,
  Package,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export default async function AccountDashboardPage() {
  const session = await auth();
  const user = await currentUser();

  let orders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: Date;
    items: unknown;
  }> = [];
  let orderStats = { total: 0, pending: 0, confirmed: 0, completed: 0 };

  try {
    orders = await prisma.order.findMany({
      where: { userId: session?.userId ?? undefined },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: { userId: session?.userId ?? undefined },
      _count: {
        status: true,
      },
    });

    orderStats = {
      total: statusCounts.reduce((sum, item) => sum + item._count.status, 0),
      pending: statusCounts.find((item) => item.status === 'pending')?._count.status ?? 0,
      confirmed: statusCounts.find((item) => item.status === 'confirmed')?._count.status ?? 0,
      completed: statusCounts.find((item) => item.status === 'completed')?._count.status ?? 0,
    };
  } catch {
    // DB not ready
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
        </h1>
        <p className="text-muted-foreground text-sm">
          Here&apos;s an overview of your account activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <ShoppingBag className="h-6 w-6 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{orderStats.total}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{orderStats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Truck className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{orderStats.confirmed}</p>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{orderStats.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Orders</CardTitle>
          <Link href="/account/orders">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No orders yet</p>
              <Link href="/order">
                <Button>Place Your First Order</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.orderNumber}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-sm font-mono">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="font-bold text-sm">
                      ${order.total.toFixed(2)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/order">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-amber-600" />
              <div>
                <p className="font-semibold text-sm">New Order</p>
                <p className="text-xs text-muted-foreground">Place a new order</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/account/profile">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-semibold text-sm">Edit Profile</p>
                <p className="text-xs text-muted-foreground">Update your info</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/account/addresses">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Truck className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Addresses</p>
                <p className="text-xs text-muted-foreground">Manage delivery addresses</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/reviews/submit">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Star className="h-8 w-8 text-purple-600" />
              <div>
                <p className="font-semibold text-sm">Leave a Review</p>
                <p className="text-xs text-muted-foreground">Share your feedback</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    pending: { label: "Pending", variant: "outline" },
    confirmed: { label: "Confirmed", variant: "default" },
    processing: { label: "Processing", variant: "secondary" },
    ready: { label: "Ready", variant: "default" },
    completed: { label: "Completed", variant: "secondary" },
    canceled: { label: "Canceled", variant: "outline" },
  };
  const { label, variant } = config[status] || { label: status, variant: "outline" as const };
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}
