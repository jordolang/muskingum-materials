import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, MapPin, Truck, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { StatusUpdater } from "@/components/admin/status-updater";
import { requireAdmin } from "@/lib/admin-auth";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
  > = {
    pending: { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    confirmed: { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
    processing: { variant: "outline", className: "bg-purple-50 text-purple-700 border-purple-200" },
    ready: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
    completed: { variant: "outline", className: "bg-gray-50 text-gray-700 border-gray-200" },
    canceled: { variant: "destructive" },
  };

  const config = variants[status] || { variant: "secondary" as const };

  return (
    <Badge variant={config.variant} className={config.className}>
      {status}
    </Badge>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
  > = {
    pending: { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    paid: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
    failed: { variant: "destructive" },
    refunded: { variant: "outline", className: "bg-gray-50 text-gray-700 border-gray-200" },
  };

  const config = variants[status] || { variant: "secondary" as const };

  return (
    <Badge variant={config.variant} className={config.className}>
      {status}
    </Badge>
  );
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  // Check admin authentication
  const user = await requireAdmin();
  if (!user) {
    redirect("/admin");
  }

  const { id } = await params;

  let order;
  try {
    order = await prisma.order.findUnique({
      where: { id },
    });
  } catch {
    // DB not ready
  }

  if (!order) notFound();

  const items = order.items as Array<{
    name: string;
    price: number;
    quantity: number;
    unit: string;
  }>;

  const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "processing", label: "Processing" },
    { value: "ready", label: "Ready" },
    { value: "completed", label: "Completed" },
    { value: "canceled", label: "Canceled" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/orders"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Orders
        </Link>
        <h1 className="text-2xl font-bold font-heading font-mono">
          {order.orderNumber}
        </h1>
        <p className="text-sm text-muted-foreground">
          Placed on{" "}
          {new Date(order.createdAt).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Status Badges */}
      <div className="flex gap-3">
        <StatusBadge status={order.status} />
        <PaymentBadge status={order.paymentStatus} />
      </div>

      {/* Status Updater */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusUpdater
            currentStatus={order.status}
            statusOptions={STATUS_OPTIONS}
            resourceId={order.id}
            resourceType="orders"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <p className="font-bold">${item.price.toFixed(2)}</p>
                    </div>
                    {idx < items.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}

                <Separator className="my-4" />

                {/* Pricing Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>${order.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer & Delivery Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Customer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{order.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{order.email}</p>
              </div>
              {order.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {order.pickupOrDeliver === "deliver" ? (
                  <Truck className="h-5 w-5" />
                ) : (
                  <MapPin className="h-5 w-5" />
                )}
                {order.pickupOrDeliver === "deliver" ? "Delivery" : "Pickup"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.pickupOrDeliver === "deliver" && order.deliveryAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium whitespace-pre-line">{order.deliveryAddress}</p>
                </div>
              )}
              {order.deliveryNotes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{order.deliveryNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
