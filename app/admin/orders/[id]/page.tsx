import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, MapPin, Truck, Mail, Map as MapIcon, Printer, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { StatusUpdater } from "@/components/admin/status-updater";
import { RefundButton } from "@/components/admin/refund-button";
import { requireAdmin } from "@/lib/admin-auth";
import { ConfidenceRangeDisplay } from "@/components/order/confidence-range-display";

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

  // Type assertion for newer fields (Prisma client types may be stale in worktree)
  const orderWithConfidence = order as typeof order & {
    projectEstimateTonsLow?: number | null;
    projectEstimateTonsHigh?: number | null;
    projectEstimateCubicYardsLow?: number | null;
    projectEstimateCubicYardsHigh?: number | null;
    deliveryAccessChecklist?: Record<string, unknown> | null;
    dropLocationNotes?: string | null;
    dropLocationPhotoUrl?: string | null;
    dropLocationLat?: number | null;
    dropLocationLng?: number | null;
    accessWarningFlags?: string[] | null;
  };

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
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={order.status} />
        <PaymentBadge status={order.paymentStatus} />
        {order.invoiceUrl && (
          <a
            href={order.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2 hover:no-underline"
          >
            <Printer className="h-3 w-3" />
            Stripe receipt
          </a>
        )}
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

      {/* Project site (customer-captured satellite outline) */}
      {(order.projectMapImageUrl ||
        order.projectAddress ||
        order.projectEstimateTons) && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              Project site (customer-captured)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.projectAddress && (
              <p className="text-sm">
                <span className="text-muted-foreground">Address: </span>
                <span className="font-medium">{order.projectAddress}</span>
              </p>
            )}
            {order.projectMapImageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={order.projectMapImageUrl}
                alt="Project area outlined on satellite imagery"
                className="w-full max-w-xl rounded-lg border"
              />
            )}
            {(order.projectEstimateTons != null ||
              order.projectAreaSqFt != null) && (
              <>
                {/* Confidence Range Display */}
                {order.projectEstimateTons != null && (
                  <div className="mb-4">
                    <ConfidenceRangeDisplay
                      estimate={{
                        tons: order.projectEstimateTons,
                        tonsLow: orderWithConfidence.projectEstimateTonsLow ?? undefined,
                        tonsExpected: order.projectEstimateTons,
                        tonsHigh: orderWithConfidence.projectEstimateTonsHigh ?? undefined,
                        cubicYards: order.projectEstimateCubicYards ?? 0,
                        cubicYardsLow: orderWithConfidence.projectEstimateCubicYardsLow ?? undefined,
                        cubicYardsExpected: order.projectEstimateCubicYards ?? undefined,
                        cubicYardsHigh: orderWithConfidence.projectEstimateCubicYardsHigh ?? undefined,
                        depthVariance: 0.5,
                      }}
                    />
                  </div>
                )}
                {/* Area and Depth Stats */}
                <div className="grid grid-cols-2 gap-3">
                  {order.projectAreaSqFt != null && (
                    <AdminStat
                      label="Area (sq ft)"
                      value={Math.round(order.projectAreaSqFt).toLocaleString()}
                    />
                  )}
                  {order.projectDepthInches != null && (
                    <AdminStat
                      label="Depth"
                      value={`${order.projectDepthInches}"`}
                    />
                  )}
                </div>
              </>
            )}
            <p className="text-xs text-muted-foreground">
              Source:{" "}
              <span className="font-medium">
                {order.projectEstimateSource ?? "—"}
              </span>{" "}
              · Customer self-estimate, not survey data. Verify before
              dispatching.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/order/${order.orderNumber}/receipt`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Printer className="h-3.5 w-3.5" />
                Open printable receipt
              </Link>
              {order.invoiceUrl && (
                <a
                  href={order.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Stripe receipt
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Access & Drop Location (driver instructions) */}
      {(orderWithConfidence.deliveryAccessChecklist ||
        orderWithConfidence.dropLocationNotes ||
        orderWithConfidence.dropLocationPhotoUrl ||
        (orderWithConfidence.dropLocationLat != null && orderWithConfidence.dropLocationLng != null) ||
        (Array.isArray(orderWithConfidence.accessWarningFlags) &&
          orderWithConfidence.accessWarningFlags.length > 0)) && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Access & Drop Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Access Checklist */}
            {orderWithConfidence.deliveryAccessChecklist && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Access Checklist
                </p>
                <AccessChecklistDisplay
                  checklist={
                    orderWithConfidence.deliveryAccessChecklist as {
                      drivewayWidth?: string;
                      overheadClearance?: string;
                      turningRoom?: string;
                      surface?: string;
                      gateCode?: string;
                    }
                  }
                />
              </div>
            )}

            {/* Warning Flags */}
            {orderWithConfidence.accessWarningFlags &&
              Array.isArray(orderWithConfidence.accessWarningFlags) &&
              (orderWithConfidence.accessWarningFlags as string[]).length > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-amber-900">
                        Access Warnings
                      </p>
                      <ul className="text-sm text-amber-800 list-disc list-inside space-y-0.5">
                        {(orderWithConfidence.accessWarningFlags as string[]).map(
                          (flag, idx) => (
                            <li key={idx}>
                              {flag
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

            {/* Drop Location Notes */}
            {orderWithConfidence.dropLocationNotes && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Drop Location Notes
                </p>
                <p className="text-sm bg-muted/30 rounded-lg p-3 whitespace-pre-line">
                  {orderWithConfidence.dropLocationNotes}
                </p>
              </div>
            )}

            {/* Drop Location Photo */}
            {orderWithConfidence.dropLocationPhotoUrl && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Drop Location Photo
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={orderWithConfidence.dropLocationPhotoUrl}
                  alt="Drop location marked by customer"
                  className="w-full max-w-xl rounded-lg border"
                />
              </div>
            )}

            {/* Drop Location Map */}
            {orderWithConfidence.dropLocationLat != null && orderWithConfidence.dropLocationLng != null && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Drop Location Pin
                </p>
                <a
                  href={`https://www.google.com/maps?q=${orderWithConfidence.dropLocationLat},${orderWithConfidence.dropLocationLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${orderWithConfidence.dropLocationLat},${orderWithConfidence.dropLocationLng}&zoom=18&size=600x300&maptype=satellite&markers=color:red%7C${orderWithConfidence.dropLocationLat},${orderWithConfidence.dropLocationLng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                    alt="Drop location on map"
                    className="w-full max-w-xl rounded-lg border hover:opacity-90 transition-opacity"
                  />
                </a>
                <p className="text-xs text-muted-foreground">
                  Click map to open in Google Maps
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

          {/* Refund — only for paid Stripe orders */}
          {order.paymentStatus === "paid" && order.stripePaymentId && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Refund</CardTitle>
              </CardHeader>
              <CardContent>
                <RefundButton
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  orderTotal={order.total}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mt-0.5">
        {label}
      </p>
    </div>
  );
}

function AccessChecklistDisplay({
  checklist,
}: {
  checklist: {
    drivewayWidth?: string;
    overheadClearance?: string;
    turningRoom?: string;
    surface?: string;
    gateCode?: string;
  };
}) {
  const items = [
    {
      label: "Driveway Width",
      value: checklist.drivewayWidth,
      warning: ["narrow", "very_narrow"],
    },
    {
      label: "Overhead Clearance",
      value: checklist.overheadClearance,
      warning: ["low", "very_low", "less_than"],
    },
    {
      label: "Turning Room",
      value: checklist.turningRoom,
      warning: ["tight", "very_tight", "none"],
    },
    { label: "Surface Type", value: checklist.surface, warning: [] },
    { label: "Gate Code", value: checklist.gateCode, warning: [] },
  ];

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        if (!item.value) return null;

        const isWarning =
          item.warning.length > 0 &&
          item.warning.some((w) =>
            item.value?.toLowerCase().includes(w.toLowerCase())
          );

        return (
          <div
            key={idx}
            className="flex items-start justify-between gap-4 text-sm py-2 border-b last:border-0"
          >
            <span className="text-muted-foreground font-medium">
              {item.label}
            </span>
            <span className="flex items-center gap-2">
              {isWarning ? (
                <XCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              )}
              <span className={isWarning ? "text-amber-900 font-medium" : ""}>
                {item.value}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
