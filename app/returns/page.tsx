import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { BUSINESS_INFO } from "@/data/business";
import { POLICY_LAST_UPDATED } from "@/lib/constants/legal";

export const metadata = {
  title: "Returns & Refund Policy",
  description:
    "Returns, refund, cancellation, and order-change policies for Muskingum Materials bulk material orders.",
};

export default function ReturnsPage() {
  return (
    <div className="py-12">
      <div className="container max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <RotateCcw className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold font-heading">
            Returns &amp; Refund Policy
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Last updated: {POLICY_LAST_UPDATED}
        </p>

        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 mb-8 text-sm text-amber-900 dark:text-amber-200">
          <strong>Bulk materials are sold by weight.</strong> Because aggregate,
          sand, and soil are loose, perishable-to-contamination products that
          cannot be re-stocked once off-loaded, our return policy differs from a
          typical retail store. Please review the terms below before ordering.
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              1. Order Cancellations
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">
                  Cancelled before dispatch / pickup:
                </strong>{" "}
                Full refund of the material cost. The non-refundable card
                processing fee (typically 4.5%) charged by our payment processor
                cannot be returned.
              </li>
              <li>
                <strong className="text-foreground">
                  Cancelled after dispatch but before delivery:
                </strong>{" "}
                A 50% restocking / turnaround fee applies to the materials, and
                the delivery fee is non-refundable.
              </li>
              <li>
                To cancel, call us as early as possible at{" "}
                <a
                  href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}
                  className="text-primary hover:underline"
                >
                  {BUSINESS_INFO.phone}
                </a>
                .
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              2. Delivered &amp; Picked-Up Materials
            </h2>
            <p className="text-muted-foreground">
              <strong className="text-foreground">All sales are final</strong>{" "}
              once material has been off-loaded at your site or loaded into your
              vehicle. Loose bulk material cannot be returned, re-stocked, or
              refunded after it leaves our scales because it can no longer be
              certified for cleanliness, weight, or composition.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              3. Wrong or Defective Product
            </h2>
            <p className="text-muted-foreground">
              If we delivered the wrong product, or the material is materially
              different from what you ordered, contact us within{" "}
              <strong className="text-foreground">48 hours</strong> of delivery
              with your order number and photos. If we confirm the error, we
              will, at our discretion, replace the material, deliver the correct
              product, or issue a refund or credit for the affected portion of
              the order.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              4. Weight Tolerance
            </h2>
            <p className="text-muted-foreground">
              Materials are sold by weight using state-certified scales. A ±5%
              variance is considered within normal tolerance and is not grounds
              for a refund. Natural variation in moisture content and aggregate
              composition means exact tonnage cannot be guaranteed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              5. When We Cannot Fulfill an Order
            </h2>
            <p className="text-muted-foreground">
              If Muskingum Materials is unable to fulfill your order — for
              example, due to inventory, equipment, or weather — you will receive
              a full refund, including any processing and delivery fees, within
              5–7 business days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              6. How Refunds Are Issued
            </h2>
            <p className="text-muted-foreground">
              Approved refunds are returned to the original payment method.
              Card refunds typically post within 5–10 business days depending on
              your bank. We will email a confirmation when a refund is
              processed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">7. Questions?</h2>
            <address className="not-italic text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">
                {BUSINESS_INFO.name}
              </p>
              <p>
                {BUSINESS_INFO.address}, {BUSINESS_INFO.city},{" "}
                {BUSINESS_INFO.state} {BUSINESS_INFO.zip}
              </p>
              <p>
                <a
                  href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}
                  className="hover:text-primary"
                >
                  {BUSINESS_INFO.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${BUSINESS_INFO.email}`}
                  className="text-primary hover:underline"
                >
                  {BUSINESS_INFO.email}
                </a>
              </p>
            </address>
            <p className="text-muted-foreground">
              See also our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service &amp; Delivery Agreement
              </Link>{" "}
              for the full delivery and cancellation terms, or{" "}
              <Link href="/contact" className="text-primary hover:underline">
                use our contact form
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
