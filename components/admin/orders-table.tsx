import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  items: unknown;
  subtotal: number;
  tax: number;
  processingFee: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string | null;
  deliveryNotes: string | null;
  pickupOrDeliver: string;
  status: string;
  paymentStatus: string;
  stripeSessionId: string | null;
  stripePaymentId: string | null;
  invoiceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <Package className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No orders found</h2>
          <p className="text-muted-foreground">
            Orders will appear here as customers place them.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const items = order.items as Array<{ name: string; quantity: number; unit: string }>;
        return (
          <Link key={order.id} href={`/admin/orders/${order.orderNumber}`}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold font-mono text-sm">
                        {order.orderNumber}
                      </p>
                      <StatusBadge status={order.status} />
                      <PaymentBadge status={order.paymentStatus} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      <div>
                        <p className="text-sm font-medium">{order.name}</p>
                        <p className="text-xs text-muted-foreground">{order.email}</p>
                        {order.phone && (
                          <p className="text-xs text-muted-foreground">{order.phone}</p>
                        )}
                      </div>
                      <div>
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
                    </div>
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
