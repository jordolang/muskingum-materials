import Link from "next/link";
import { Trash2 } from "lucide-react";
import { BUSINESS_INFO } from "@/data/business";
import { POLICY_LAST_UPDATED } from "@/lib/constants/legal";

export const metadata = {
  title: "Delete My Data Request",
  description:
    "How to request deletion of the personal data Muskingum Materials holds about you, what gets deleted, and what we are legally required to retain.",
};

const SUBJECT = encodeURIComponent("Data Deletion Request");
const BODY = encodeURIComponent(
  "I would like to request deletion of the personal data Muskingum Materials holds about me.\n\nFull name:\nEmail used for orders/account:\nPhone number:\nOrder number(s) (if known):\n",
);

export default function DataDeletionPage() {
  return (
    <div className="py-12">
      <div className="container max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <Trash2 className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold font-heading">
            Delete My Data Request
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Last updated: {POLICY_LAST_UPDATED}
        </p>

        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 mb-8 text-sm text-amber-900 dark:text-amber-200">
          You can ask us to delete the personal information we hold about you at
          any time. We honor verified deletion requests within{" "}
          <strong>90 days</strong> (often sooner), except where the law requires
          us to keep certain records (see below).
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              1. How to Submit a Request
            </h2>
            <p className="text-muted-foreground">
              Email us from the address associated with your account or orders so
              we can verify your identity. Include your full name, the email and
              phone number you used, and any relevant order numbers.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href={`mailto:${BUSINESS_INFO.email}?subject=${SUBJECT}&body=${BODY}`}
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
                Email a Deletion Request
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-md border text-sm font-medium px-4 py-2 hover:bg-muted transition-colors"
              >
                Use the Contact Form
              </Link>
            </div>
            <p className="text-muted-foreground">
              You may also call us at{" "}
              <a
                href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}
                className="text-primary hover:underline"
              >
                {BUSINESS_INFO.phone}
              </a>{" "}
              and we will guide you through verifying your request.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              2. What Gets Deleted
            </h2>
            <p className="text-muted-foreground">
              Once verified, we will delete or irreversibly anonymize the
              personal data we control, including:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Your account profile and saved addresses</li>
              <li>Contact-form, quote-request, and lead submissions</li>
              <li>AI chat assistant conversation history tied to you</li>
              <li>Newsletter and SMS subscription records</li>
              <li>
                Saved project estimates, comparisons, and other personalization
                data
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              3. What We Must Keep
            </h2>
            <p className="text-muted-foreground">
              Some records must be retained even after a deletion request to
              comply with tax, accounting, and legal obligations. We keep the
              minimum necessary and restrict access to it:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">
                  Completed order &amp; invoice records:
                </strong>{" "}
                retained for 7 years for tax and legal compliance
              </li>
              <li>
                <strong className="text-foreground">
                  Payment transaction records:
                </strong>{" "}
                held by our payment processor (Stripe) per their retention
                schedule; we never store full card details
              </li>
            </ul>
            <p className="text-muted-foreground">
              Where we are required to retain a record, we remove or mask any
              personal details that are not legally required.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              4. Third-Party Providers
            </h2>
            <p className="text-muted-foreground">
              When you submit a verified deletion request, we also forward
              deletion instructions to the third-party processors that act on our
              behalf where applicable — for example Postmark (email) and our
              database host. Analytics data collected by Google Analytics is
              aggregated and governed by Google&apos;s own retention controls.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              5. Timeline &amp; Confirmation
            </h2>
            <p className="text-muted-foreground">
              We confirm receipt of your request within 5 business days and
              complete verified deletions within 90 days, in line with our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              — usually much sooner. We will email you when the deletion is
              complete. If we cannot fully delete certain data for the legal
              reasons above, we will tell you what we kept and why.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">6. Related Policies</h2>
            <p className="text-muted-foreground">
              For the full picture of what we collect and how it is used, see our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              and our{" "}
              <Link
                href="/data-use-policy"
                className="text-primary hover:underline"
              >
                Data Use &amp; Protection Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
