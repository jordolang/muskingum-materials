import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Phone,
  Mail,
  Download,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { BUSINESS_INFO } from "@/data/business";
import { SaveTemplateButton } from "@/components/order/save-template-button";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const session = await auth();
  const { orderNumber } = await params;

  let order;
  try {
    order = await prisma.order.findFirst({
      where: {
        orderNumber,
        userId: session?.userId ?? undefined,
      },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/account/orders"
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
        <div className="flex gap-2">
          <SaveTemplateButton
            items={items}
            pickupOrDeliver={order.pickupOrDeliver}
            deliveryAddress={order.deliveryAddress}
          />
          <Button variant="outline" size="sm" className="gap-1" onClick={() => {}}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="flex gap-3">
        <StatusBadge status={order.status} />
        <PaymentBadge status={order.paymentStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items - Invoice Style */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg" id="invoice">
            <CardHeader className="bg-stone-800 text-white rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Invoice</CardTitle>
                  <p className="text-sm text-stone-300">{order.orderNumber}</p>
                </div>
                <div className="text-right text-sm text-stone-300">
                  <p className="font-bold text-white">{BUSINESS_INFO.name}</p>
                  <p>{BUSINESS_INFO.address}</p>
                  <p>{BUSINESS_INFO.city}, {BUSINESS_INFO.state} {BUSINESS_INFO.zip}</p>
                  <p>{BUSINESS_INFO.phone}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Bill To */}
              <div className="mb-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Bill To
                </p>
                <p className="font-semibold">{order.name}</p>
                <p className="text-sm text-muted-foreground">{order.email}</p>
                {order.phone && (
                  <p className="text-sm text-muted-foreground">{order.phone}</p>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-semibold">Product</th>
                    <th className="pb-2 font-semibold text-center">Qty</th>
                    <th className="pb-2 font-semibold text-right">Unit Price</th>
                    <th className="pb-2 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3 font-medium">{item.name}</td>
                      <td className="py-3 text-center">
                        {item.quantity} {item.unit}{item.quantity !== 1 ? "s" : ""}
                      </td>
                      <td className="py-3 text-right">${item.price.toFixed(2)}</td>
                      <td className="py-3 text-right font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (7.25%)</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing Fee (4.5%)</span>
                  <span>${order.processingFee.toFixed(2)}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>${order.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold pt-1">
                  <span>Total</span>
                  <span className="text-amber-700">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Fulfillment */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                {order.pickupOrDeliver === "delivery" ? (
                  <Truck className="h-4 w-4 text-amber-600" />
                ) : (
                  <MapPin className="h-4 w-4 text-amber-600" />
                )}
                {order.pickupOrDeliver === "delivery" ? "Delivery" : "Pickup"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {order.pickupOrDeliver === "delivery" ? (
                <>
                  <p>{order.deliveryAddress}</p>
                  {order.deliveryNotes && (
                    <p className="mt-2 text-xs italic">Note: {order.deliveryNotes}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">{BUSINESS_INFO.name}</p>
                  <p>{BUSINESS_INFO.address}</p>
                  <p>{BUSINESS_INFO.city}, {BUSINESS_INFO.state} {BUSINESS_INFO.zip}</p>
                  <p className="mt-2">{BUSINESS_INFO.hours}</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-sm">Customer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{order.name}</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span>{order.email}</span>
              </div>
              {order.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{order.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Need Help */}
          <Card className="border-0 shadow-md bg-muted/50">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium mb-2">Need help with this order?</p>
              <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
                <Button variant="outline" size="sm" className="gap-2 w-full">
                  <Phone className="h-4 w-4" />
                  Call {BUSINESS_INFO.phone}
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
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
    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  if (status === "paid") {
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Paid</span>;
  }
  if (status === "unpaid") {
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">Unpaid</span>;
  }
  return null;
}
