import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BUSINESS_INFO } from "@/data/business";
import { PrintReceiptButton } from "./print-button";

interface ReceiptPageProps {
  params: Promise<{ orderNumber: string }>;
}

export async function generateMetadata({
  params,
}: ReceiptPageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Receipt — ${orderNumber}`,
    description: "Order receipt for Muskingum Materials.",
    robots: { index: false, follow: false },
  };
}

interface OrderItemRow {
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export default async function OrderReceiptPage({ params }: ReceiptPageProps) {
  const { orderNumber } = await params;

  let order;
  try {
    order = await prisma.order.findUnique({
      where: { orderNumber },
    });
  } catch {
    // DB might not have the new project columns yet — surface 404
    // rather than 500 so the user sees a clean failure mode.
    return notFound();
  }

  if (!order) return notFound();

  const items = (order.items as unknown as OrderItemRow[] | null) ?? [];
  const placedAt = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="receipt-page py-8 print:py-0">
      <div className="container max-w-3xl print:max-w-none print:px-0">
        {/* Print toolbar — hidden in print */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div>
            <p className="text-sm text-muted-foreground">Order receipt</p>
            <h1 className="text-2xl font-bold font-heading font-mono">
              {order.orderNumber}
            </h1>
          </div>
          <PrintReceiptButton />
        </div>

        <div className="rounded-lg border bg-card p-8 print:border-0 print:p-0">
          {/* Letterhead */}
          <header className="flex items-start justify-between border-b pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold font-heading">
                {BUSINESS_INFO.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {BUSINESS_INFO.address}, {BUSINESS_INFO.city},{" "}
                {BUSINESS_INFO.state} {BUSINESS_INFO.zip}
              </p>
              <p className="text-sm text-muted-foreground">
                {BUSINESS_INFO.phone} · {BUSINESS_INFO.email}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Order
              </p>
              <p className="font-mono font-bold">{order.orderNumber}</p>
              <p className="text-xs text-muted-foreground mt-1">{placedAt}</p>
            </div>
          </header>

          {/* Customer + fulfillment */}
          <section className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                Customer
              </h3>
              <p className="font-medium">{order.name}</p>
              <p className="text-sm">{order.email}</p>
              {order.phone ? <p className="text-sm">{order.phone}</p> : null}
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                {order.pickupOrDeliver === "delivery" ||
                order.pickupOrDeliver === "deliver"
                  ? "Delivery"
                  : "Pickup"}
              </h3>
              {order.pickupOrDeliver === "delivery" ||
              order.pickupOrDeliver === "deliver" ? (
                <p className="text-sm whitespace-pre-line">
                  {order.deliveryAddress ?? "—"}
                </p>
              ) : (
                <p className="text-sm">Pickup at the Muskingum Materials yard.</p>
              )}
              {order.deliveryNotes ? (
                <p className="text-sm text-muted-foreground mt-1">
                  Notes: {order.deliveryNotes}
                </p>
              ) : null}
            </div>
          </section>

          {/* Project site */}
          {(order.projectMapImageUrl ||
            order.projectAddress ||
            order.projectEstimateTons != null) && (
            <section className="mb-6 border rounded-lg p-4 bg-muted/20 print:bg-transparent">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                Project site (customer self-estimate)
              </h3>
              {order.projectAddress ? (
                <p className="text-sm mb-3">
                  <span className="text-muted-foreground">Address: </span>
                  <span className="font-medium">{order.projectAddress}</span>
                </p>
              ) : null}
              {order.projectMapImageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={order.projectMapImageUrl}
                  alt="Project area outlined on satellite imagery"
                  className="w-full max-w-2xl rounded-lg border mb-3"
                />
              ) : null}
              {(order.projectEstimateTons != null ||
                order.projectAreaSqFt != null) && (
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  {order.projectEstimateTons != null && (
                    <ReceiptStat
                      label="Tons (est.)"
                      value={order.projectEstimateTons.toFixed(1)}
                    />
                  )}
                  {order.projectEstimateCubicYards != null && (
                    <ReceiptStat
                      label="Cubic yards"
                      value={order.projectEstimateCubicYards.toFixed(1)}
                    />
                  )}
                  {order.projectAreaSqFt != null && (
                    <ReceiptStat
                      label="Area (sq ft)"
                      value={Math.round(order.projectAreaSqFt).toLocaleString()}
                    />
                  )}
                  {order.projectDepthInches != null && (
                    <ReceiptStat
                      label="Depth"
                      value={`${order.projectDepthInches}"`}
                    />
                  )}
                </dl>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                Estimate source:{" "}
                <span className="font-medium">
                  {order.projectEstimateSource ?? "—"}
                </span>{" "}
                · Captured by the customer from satellite imagery — not survey
                data. Order ~5–10% extra for compaction and waste.
              </p>
            </section>
          )}

          {/* Line items */}
          <section className="mb-6">
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
              Items
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 font-medium">Material</th>
                  <th className="py-2 font-medium text-right">Qty</th>
                  <th className="py-2 font-medium text-right">Price</th>
                  <th className="py-2 font-medium text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={`${item.name}-${idx}`} className="border-b">
                    <td className="py-2 font-medium">{item.name}</td>
                    <td className="py-2 text-right tabular-nums">
                      {item.quantity} {item.unit}
                      {item.quantity !== 1 ? "s" : ""}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Totals */}
          <section className="ml-auto max-w-xs space-y-1 text-sm">
            <Row
              label="Subtotal"
              value={`$${order.subtotal.toFixed(2)}`}
            />
            {order.deliveryFee > 0 && (
              <Row
                label="Delivery fee"
                value={`$${order.deliveryFee.toFixed(2)}`}
              />
            )}
            <Row label="Tax (7.25%)" value={`$${order.tax.toFixed(2)}`} />
            <Row
              label="Card processing"
              value={`$${order.processingFee.toFixed(2)}`}
            />
            <div className="border-t pt-1 mt-1 flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums">${order.total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Status: <span className="font-medium">{order.status}</span> ·
              Payment:{" "}
              <span className="font-medium">{order.paymentStatus}</span>
            </p>
          </section>

          <footer className="mt-10 pt-4 border-t text-xs text-muted-foreground">
            Questions? Call {BUSINESS_INFO.phone} or email {BUSINESS_INFO.email}.
            {" "}This receipt was generated automatically and includes the
            customer-captured project outline used to estimate material need.
          </footer>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function ReceiptStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/60 p-2 text-center">
      <p className="text-base font-bold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mt-0.5">
        {label}
      </p>
    </div>
  );
}
