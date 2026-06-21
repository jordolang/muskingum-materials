import Link from "next/link";
import { Lock } from "lucide-react";
import { BUSINESS_INFO } from "@/data/business";
import { POLICY_LAST_UPDATED } from "@/lib/constants/legal";

export const metadata = {
  title: "Data Use & Protection Policy | Muskingum Materials",
  description:
    "How Muskingum Materials handles, secures, and protects the data you share when you use our website, place an order, or contact us.",
};

// Third-party processors and the safeguard each one provides. Kept as a
// file-level constant so the table is easy to audit and maintain.
const DATA_PROVIDERS: ReadonlyArray<readonly [string, string]> = [
  ["Stripe", "Payments — PCI-DSS Level 1, card data never touches our servers"],
  ["Clerk", "Authentication — manages credentials and sessions securely"],
  ["Neon", "Database — encrypted, access-controlled Postgres hosting"],
  ["Postmark", "Transactional email — order receipts and updates only"],
  ["Anthropic (Claude)", "AI chat — processes chat messages to answer questions"],
  ["Google Analytics", "Usage analytics — IP anonymization enabled"],
  ["Upstash", "Rate limiting — protects endpoints from abuse"],
  ["Vercel", "Hosting — serves the site over encrypted connections"],
];

export default function DataUsePolicyPage() {
  return (
    <div className="py-12">
      <div className="container max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold font-heading">
            Data Use &amp; Protection Policy
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Last updated: {POLICY_LAST_UPDATED}
        </p>

        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 mb-8 text-sm text-amber-900 dark:text-amber-200">
          This policy explains, in plain terms, <strong>how we handle and
          protect</strong> the information you share with us. It complements our{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          , which describes <em>what</em> we collect and your rights over it.
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              1. Our Data Principles
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">Collect only what we need.</strong>{" "}
                We ask for the minimum information required to quote, fulfill, and
                support your order.
              </li>
              <li>
                <strong className="text-foreground">Use it only for why we collected it.</strong>{" "}
                We do not sell your personal information, and we do not use it for
                unrelated purposes.
              </li>
              <li>
                <strong className="text-foreground">Keep it only as long as needed.</strong>{" "}
                Data is deleted or anonymized once it is no longer required for
                the purpose it was collected or for a legal obligation.
              </li>
              <li>
                <strong className="text-foreground">Protect it by default.</strong>{" "}
                Security is built into how the site and our vendors operate, not
                bolted on afterward.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              2. How Your Data Is Protected in Transit
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                All traffic to and from this website is encrypted with HTTPS/TLS.
              </li>
              <li>
                A strict Content-Security-Policy limits which external services
                the site is allowed to talk to, reducing the risk of injected or
                malicious scripts.
              </li>
              <li>
                Public input endpoints (orders, contact, quotes, chat) are rate
                limited to defend against abuse and automated attacks.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              3. How Your Data Is Protected at Rest
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                Order, account, and contact records are stored in a managed,
                access-controlled PostgreSQL database (Neon) with encryption at
                rest.
              </li>
              <li>
                <strong className="text-foreground">
                  We never store full payment card numbers.
                </strong>{" "}
                Card data is captured and processed directly by Stripe, a
                PCI-DSS Level 1 certified payment provider. We only retain a
                payment status and a reference token.
              </li>
              <li>
                Account credentials and sessions are managed by Clerk; we do not
                store your raw password.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              4. Who Can Access Your Data
            </h2>
            <p className="text-muted-foreground">
              Access to customer data is limited to authorized Muskingum Materials
              staff who need it to process orders and provide support, and to the
              vetted service providers listed in our Privacy Policy who process
              data on our behalf under contract. Each provider is used only for
              the specific function it performs:
            </p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-4 font-semibold">
                      Provider
                    </th>
                    <th className="text-left py-2 px-4 font-semibold">
                      Role &amp; Safeguard
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {DATA_PROVIDERS.map(([provider, role]) => (
                    <tr key={provider}>
                      <td className="py-2 px-4 font-medium">{provider}</td>
                      <td className="py-2 px-4 text-muted-foreground">{role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              5. Payment &amp; Pricing Integrity
            </h2>
            <p className="text-muted-foreground">
              Order totals are always re-validated on our server against
              authoritative pricing before any charge is created — prices
              submitted by the browser are never trusted. This protects both you
              and us from tampering and billing errors.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              6. AI Chat Data
            </h2>
            <p className="text-muted-foreground">
              Messages you send to our AI chat assistant are processed to generate
              a helpful reply and may be stored to improve service quality. Please
              avoid sharing sensitive personal information (such as card numbers
              or government IDs) in chat. Chat transcripts are covered by your
              deletion rights below.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              7. Cookies &amp; Tracking
            </h2>
            <p className="text-muted-foreground">
              We use cookies that are necessary for the site to function
              (authentication and secure checkout) and, with your consent,
              analytics cookies to understand how the site is used. You can manage
              analytics consent through the cookie banner and your browser
              settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              8. Data Breach Response
            </h2>
            <p className="text-muted-foreground">
              In the unlikely event of a data breach that affects your personal
              information, we will investigate promptly, take steps to contain it,
              and notify affected customers and any required authorities in
              accordance with applicable law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              9. Your Control Over Your Data
            </h2>
            <p className="text-muted-foreground">
              You can access, correct, export, or delete your data. To remove your
              information, see{" "}
              <Link
                href="/data-deletion"
                className="text-primary hover:underline"
              >
                Delete My Data Request
              </Link>
              . For the full list of rights, see our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">10. Contact</h2>
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
          </section>
        </div>
      </div>
    </div>
  );
}
