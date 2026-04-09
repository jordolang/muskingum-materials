import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { ReorderButton } from "@/components/account/reorder-button";

export default async function OrdersPage() {
  const session = await auth();

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

  try {
    orders = await prisma.order.findMany({
      where: { userId: session?.userId ?? undefined },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB not ready
  }

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
