import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  TrendingDown,
  Package,
  Clock,
  Repeat,
  ArrowRight,
  Award,
  DollarSign,
  ShoppingBag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export async function ContractorDashboard() {
  const session = await auth();

  let profile: {
    isContractor: boolean;
    contractorDiscount: number | null;
    company: string | null;
  } | null = null;
  let orders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: Date;
    items: unknown;
  }> = [];
  let recurringOrders: Array<{
    id: string;
    frequency: string;
    nextDeliveryDate: Date;
    status: string;
  }> = [];
  let contractorStats = {
    totalOrders: 0,
    totalSpent: 0,
    estimatedSavings: 0,
    activeRecurring: 0,
  };

  try {
    // Fetch contractor profile
    profile = await prisma.userProfile.findUnique({
      where: { userId: session?.userId ?? undefined },
      select: {
        isContractor: true,
        contractorDiscount: true,
        company: true,
      },
    });

    // Only fetch contractor data if user is a contractor
    if (profile?.isContractor) {
      // Fetch recent orders
      orders = await prisma.order.findMany({
        where: { userId: session?.userId ?? undefined },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      // Fetch active recurring orders
      recurringOrders = await prisma.recurringOrder.findMany({
        where: {
          userId: session?.userId ?? undefined,
          status: "active",
        },
        orderBy: { nextDeliveryDate: "asc" },
        take: 3,
      });

      // Calculate contractor stats
      const orderAggregates = await prisma.order.aggregate({
        where: {
          userId: session?.userId ?? undefined,
          status: { not: "canceled" },
        },
        _count: { id: true },
        _sum: { total: true },
      });

      contractorStats.totalOrders = orderAggregates._count.id;
      contractorStats.totalSpent = orderAggregates._sum.total || 0;
      contractorStats.activeRecurring = recurringOrders.length;

      // Estimate savings based on contractor discount
      if (profile.contractorDiscount && contractorStats.totalSpent > 0) {
        // Calculate what they would have paid without contractor discount
        const discountMultiplier = profile.contractorDiscount / 100;
        contractorStats.estimatedSavings =
          (contractorStats.totalSpent * discountMultiplier) /
          (1 - discountMultiplier);
      }
    }
  } catch {
    // DB not ready
  }

  // If not a contractor, return null (parent component will show standard dashboard)
  if (!profile?.isContractor) {
    return null;
  }

  const discountPercentage = profile.contractorDiscount || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold font-heading">
              Contractor Dashboard
            </h1>
            <Badge className="bg-amber-600 hover:bg-amber-700">
              <Award className="h-3 w-3 mr-1" />
              Contractor Account
            </Badge>
          </div>
          {profile.company && (
            <p className="text-muted-foreground text-sm">{profile.company}</p>
          )}
        </div>
      </div>

      {/* Contractor Benefits */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-600 rounded-lg">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Your Contractor Benefits</h3>
              <p className="text-sm text-muted-foreground">
                Exclusive pricing and savings on all orders
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-600" />
              <span className="text-sm">
                <strong>{discountPercentage}%</strong> contractor discount on
                all orders
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-amber-600" />
              <span className="text-sm">
                Set up <strong>recurring deliveries</strong> for ongoing
                projects
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contractor Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <ShoppingBag className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{contractorStats.totalOrders}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">
              ${contractorStats.totalSpent.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Spent</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-6 w-6 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">
              ${contractorStats.estimatedSavings.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Est. Savings</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Repeat className="h-6 w-6 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">
              {contractorStats.activeRecurring}
            </p>
            <p className="text-xs text-muted-foreground">Active Recurring</p>
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
                    <div className="text-right">
                      <span className="font-bold text-sm">
                        ${order.total.toFixed(2)}
                      </span>
                      {discountPercentage > 0 && (
                        <p className="text-xs text-amber-600 font-medium">
                          -{discountPercentage}% applied
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recurring Orders */}
      {recurringOrders.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Active Recurring Orders</CardTitle>
            <Link href="/account/recurring-orders">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Manage All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recurringOrders.map((recurring) => (
                <div
                  key={recurring.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-semibold text-sm capitalize">
                        {recurring.frequency} Delivery
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Next:{" "}
                        {new Date(
                          recurring.nextDeliveryDate
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {recurring.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/order">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-amber-600" />
              <div>
                <p className="font-semibold text-sm">New Order</p>
                <p className="text-xs text-muted-foreground">
                  With contractor pricing
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/account/recurring-orders">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Repeat className="h-8 w-8 text-purple-600" />
              <div>
                <p className="font-semibold text-sm">Recurring Orders</p>
                <p className="text-xs text-muted-foreground">
                  Schedule deliveries
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/account/orders">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-semibold text-sm">Order History</p>
                <p className="text-xs text-muted-foreground">View all orders</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; variant: "default" | "secondary" | "outline" }
  > = {
    pending: { label: "Pending", variant: "outline" },
    confirmed: { label: "Confirmed", variant: "default" },
    processing: { label: "Processing", variant: "secondary" },
    ready: { label: "Ready", variant: "default" },
    completed: { label: "Completed", variant: "secondary" },
    canceled: { label: "Canceled", variant: "outline" },
  };
  const { label, variant } =
    config[status] || { label: status, variant: "outline" as const };

  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  );
}
