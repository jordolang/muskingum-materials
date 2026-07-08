import Link from "next/link";
import { FileText } from "lucide-react";
import { BUSINESS_INFO } from "@/data/business";

export const metadata = {
  title: "Terms of Service & Delivery Agreement",
  description:
    "Terms of service, delivery agreement, and policies for Muskingum Materials orders.",
};

export default function TermsPage() {
  return (
    <div className="py-12">
      <div className="container max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold font-heading">
            Terms of Service &amp; Delivery Agreement
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Last updated: May 24, 2026
        </p>

        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 mb-8 text-sm text-amber-900 dark:text-amber-200">
          <strong>Disclaimer:</strong> These terms are provided as a template
          and do not constitute legal advice. Consult a licensed attorney before
          relying on this document for compliance purposes.
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground">
              By placing an order with Muskingum Materials — online, by phone,
              or in person — you agree to these Terms of Service and Delivery
              Agreement in full.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              2. Products &amp; Pricing
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>All prices are per ton unless otherwise stated</li>
              <li>
                Prices are subject to change without notice; the price shown at
                time of order applies to that order
              </li>
              <li>
                A{" "}
                <strong className="text-foreground">
                  4.5% credit card processing fee
                </strong>{" "}
                applies to all card payments
              </li>
              <li>
                Ohio sales tax (7.25%) applies to all purchases
              </li>
              <li>
                Actual delivered quantities are measured by our state-certified
                on-site scales
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              3. Site Access Requirements
            </h2>
            <p className="text-muted-foreground">
              Customer is responsible for ensuring safe and legal truck access
              to the delivery location:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                Minimum driveway/access width: <strong className="text-foreground">10 feet</strong> for standard
                delivery trucks
              </li>
              <li>
                Minimum overhead clearance: <strong className="text-foreground">14 feet</strong>
              </li>
              <li>
                The surface must support the weight of a loaded dump truck
                (approximately{" "}
                <strong className="text-foreground">80,000 lbs</strong> gross
                vehicle weight)
              </li>
              <li>
                If our driver determines the site is unsafe or inaccessible,
                the delivery will not proceed; a redelivery fee may apply
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              4. Surface Damage Waiver
            </h2>
            <p className="text-muted-foreground">
              Muskingum Materials is{" "}
              <strong className="text-foreground">not responsible</strong> for
              damage to driveways, lawns, landscaping, underground utilities,
              irrigation systems, or any surface or subsurface feature caused
              by our delivery equipment. By accepting delivery, the customer
              assumes all risk of property damage. Customer is responsible for
              marking any underground utilities, sprinkler heads, or fragile
              surfaces before the scheduled delivery time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              5. Weight Tolerance
            </h2>
            <p className="text-muted-foreground">
              Materials are sold by weight using state-certified scales. A
              ±5% variance is considered within normal tolerance. Natural
              variation in aggregate material composition means exact tonnage
              cannot be guaranteed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              6. Off-Loading &amp; Material Placement
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                Our drivers will place material as close to the customer&apos;s
                requested location as safely reachable from the truck
              </li>
              <li>
                Muskingum Materials is not responsible for final spreading,
                grading, or relocation of material
              </li>
              <li>
                Customer must be present at delivery or leave clearly marked
                placement instructions
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              7. Delivery Fees
            </h2>
            <p className="text-muted-foreground">
              Delivery fees are based on distance and are calculated at
              checkout. Additional charges may apply for remote locations,
              limited-access sites, or multiple-trip deliveries. Call{" "}
              <a
                href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}
                className="text-primary hover:underline"
              >
                {BUSINESS_INFO.phone}
              </a>{" "}
              to confirm delivery rates before placing large orders.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              8. Change-of-Address Policy
            </h2>
            <p className="text-muted-foreground">
              Delivery address changes must be communicated at least{" "}
              <strong className="text-foreground">24 hours</strong> before the
              scheduled delivery window. Changes requested after dispatch are
              not guaranteed and may incur an additional routing fee.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              9. Refund &amp; Cancellation Policy
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">
                  Cancelled before dispatch:
                </strong>{" "}
                Full refund minus any payment-processor fees (typically 4.5%)
              </li>
              <li>
                <strong className="text-foreground">
                  Cancelled after dispatch but before delivery:
                </strong>{" "}
                50% restocking/turnaround fee applies to materials; delivery
                fee is non-refundable
              </li>
              <li>
                <strong className="text-foreground">
                  Delivered materials:
                </strong>{" "}
                All sales are final once material is off-loaded. No refunds for
                delivered aggregate
              </li>
              <li>
                <strong className="text-foreground">
                  Muskingum Materials inability to fulfil:
                </strong>{" "}
                A full refund will be issued within 5–7 business days
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              10. Limitation of Liability
            </h2>
            <p className="text-muted-foreground">
              Muskingum Materials&apos; total liability for any claim arising
              from a transaction is limited to the purchase price of that order.
              We are not liable for indirect, consequential, incidental, or
              punitive damages of any kind.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              11. Governing Law
            </h2>
            <p className="text-muted-foreground">
              These terms are governed by and construed in accordance with the
              laws of the State of Ohio. Any dispute shall be brought in the
              courts of Muskingum County, Ohio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">12. Contact</h2>
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
              Questions about an order?{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Use our contact form
              </Link>{" "}
              or call us directly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
