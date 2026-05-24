import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Phone, ArrowRight, Printer, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BUSINESS_INFO } from "@/data/business";
import { PurchaseTracker } from "@/components/analytics/purchase-tracker";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description:
    "Your order has been confirmed. Thank you for choosing Muskingum Materials.",
};

interface OrderSiteSummary {
  address: string | null;
  imageUrl: string | null;
  estimateTons: number | null;
  estimateCubicYards: number | null;
  areaSqFt: number | null;
  depthInches: number | null;
  estimateSource: string | null;
}

async function loadOrderSite(orderNumber: string): Promise<OrderSiteSummary | null> {
  if (!orderNumber || orderNumber === "N/A") return null;
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        projectAddress: true,
        projectMapImageUrl: true,
        projectEstimateTons: true,
        projectEstimateCubicYards: true,
        projectAreaSqFt: true,
        projectDepthInches: true,
        projectEstimateSource: true,
      },
    });
    if (!order) return null;
    return {
      address: order.projectAddress,
      imageUrl: order.projectMapImageUrl,
      estimateTons: order.projectEstimateTons,
      estimateCubicYards: order.projectEstimateCubicYards,
      areaSqFt: order.projectAreaSqFt,
      depthInches: order.projectDepthInches,
      estimateSource: order.projectEstimateSource,
    };
  } catch {
    // DB schema may not yet have the project fields — fall back gracefully
    // so the page never errors on existing orders.
    return null;
  }
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = params.order || "N/A";
  const site = await loadOrderSite(orderNumber);

  return (
    <div className="py-12">
      <PurchaseTracker orderNumber={orderNumber} />
      <div className="container max-w-2xl space-y-6">
        <Card className="shadow-lg border-0">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />

            <h1 className="text-3xl font-bold font-heading mb-2">
              Order Confirmed!
            </h1>

            <p className="text-lg text-muted-foreground mb-4">
              Thank you for your order.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-2xl font-bold font-mono">{orderNumber}</p>
            </div>

            <div className="text-sm text-muted-foreground space-y-2 mb-6">
              <p>
                Your payment has been received. We&apos;ll prepare your order
                and contact you when it&apos;s ready for pickup or delivery.
              </p>
              <p>
                If you have any questions, call us at{" "}
                <a
                  href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}
                  className="text-primary font-medium hover:underline"
                >
                  {BUSINESS_INFO.phone}
                </a>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {orderNumber !== "N/A" && (
                <Link href={`/order/${orderNumber}/receipt`}>
                  <Button variant="outline" className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print receipt / Save as PDF
                  </Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
                <Button className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call Us
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {site && (site.imageUrl || site.address || site.estimateTons) ? (
          <Card className="shadow-lg border-0">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-bold">Project site you outlined</h2>
              </div>

              {site.address ? (
                <p className="text-sm">
                  <span className="text-muted-foreground">Address: </span>
                  <span className="font-medium">{site.address}</span>
                </p>
              ) : null}

              {site.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={site.imageUrl}
                  alt="Satellite view of the project area you outlined"
                  className="w-full rounded-lg border"
                />
              ) : null}

              {(site.estimateTons || site.areaSqFt) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {site.estimateTons != null && (
                    <Stat
                      label="Tons (est.)"
                      value={site.estimateTons.toFixed(1)}
                    />
                  )}
                  {site.estimateCubicYards != null && (
                    <Stat
                      label="Cubic yards"
                      value={site.estimateCubicYards.toFixed(1)}
                    />
                  )}
                  {site.areaSqFt != null && (
                    <Stat
                      label="Area (sq ft)"
                      value={Math.round(site.areaSqFt).toLocaleString()}
                    />
                  )}
                  {site.depthInches != null && (
                    <Stat
                      label="Depth"
                      value={`${site.depthInches}"`}
                    />
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                These figures are a customer self-estimate captured from the
                satellite outline above. They are not survey data and may
                differ from the final material count delivered. Order ~5–10%
                extra for compaction and waste.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mt-0.5">
        {label}
      </p>
    </div>
  );
}
