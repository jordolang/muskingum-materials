import Link from "next/link";
import { Shield } from "lucide-react";
import { BUSINESS_INFO } from "@/data/business";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How Muskingum Materials collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="py-12">
      <div className="container max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold font-heading">Privacy Policy</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Last updated: May 24, 2026
        </p>

        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 mb-8 text-sm text-amber-900 dark:text-amber-200">
          <strong>Disclaimer:</strong> This privacy policy is provided as a
          template and does not constitute legal advice. Consult a licensed
          attorney before relying on this document for compliance purposes.
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground">
          <section className="space-y-4">
            <h2 className="text-xl font-bold font-heading">
              1. Information We Collect
            </h2>
            <p>
              We collect the following types of information when you use our
              website or place an order:
            </p>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-1">
                  Identity &amp; Contact Information
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    Name, email address, and phone number (collected at checkout
                    and via contact forms)
                  </li>
                  <li>Delivery address when you choose delivery</li>
                  <li>
                    Account credentials managed by Clerk, our authentication
                    provider
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Payment Information</h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    Payment card details are processed directly by Stripe and
                    are never stored on our servers
                  </li>
                  <li>
                    We receive only confirmation of payment status and a Stripe
                    session ID
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  Order &amp; Transaction Data
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Order history, items purchased, quantities, and pricing</li>
                  <li>Pickup or delivery preference and delivery notes</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI Chat Transcripts</h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    Conversations with our AI chat assistant are stored in our
                    database and may be reviewed by staff to improve service
                    quality
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  Analytics &amp; Usage Data
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    Page visits and usage patterns via Google Analytics
                    (anonymized IP)
                  </li>
                  <li>Browser type, device type, and referring URL</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Process and fulfill your orders</li>
              <li>
                Send order confirmations and status updates via email and SMS
                (if opted in)
              </li>
              <li>Respond to inquiries and quote requests</li>
              <li>
                Send newsletters and promotional emails with your consent
              </li>
              <li>Improve our website and services</li>
              <li>Comply with legal and tax obligations</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              3. Third-Party Service Providers
            </h2>
            <p className="text-muted-foreground">
              We share data with the following trusted providers only to the
              extent necessary to deliver our services:
            </p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-4 font-semibold">
                      Provider
                    </th>
                    <th className="text-left py-2 px-4 font-semibold">
                      Purpose
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ["Clerk", "User authentication & account management"],
                    ["Stripe", "Payment processing"],
                    ["Postmark", "Transactional email delivery"],
                    ["Anthropic (Claude)", "AI chat assistant"],
                    ["Google Analytics", "Website usage analytics"],
                    ["Upstash", "Rate limiting"],
                    ["Neon / Vercel", "Database & hosting infrastructure"],
                  ].map(([provider, purpose]) => (
                    <tr key={provider}>
                      <td className="py-2 px-4 font-medium">{provider}</td>
                      <td className="py-2 px-4 text-muted-foreground">
                        {purpose}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              4. Data Retention
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">Order data:</strong>{" "}
                Retained for 7 years for tax and legal compliance
              </li>
              <li>
                <strong className="text-foreground">Account data:</strong>{" "}
                Retained while your account is active; deleted within 90 days
                of a verified deletion request
              </li>
              <li>
                <strong className="text-foreground">Chat conversations:</strong>{" "}
                Retained for 12 months
              </li>
              <li>
                <strong className="text-foreground">
                  Newsletter subscriptions:
                </strong>{" "}
                Retained until you unsubscribe
              </li>
              <li>
                <strong className="text-foreground">Analytics data:</strong>{" "}
                Governed by Google Analytics retention settings (default 14
                months)
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">5. Your Rights</h2>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>
                Request deletion of your data (subject to legal retention
                requirements)
              </li>
              <li>
                Opt out of marketing emails at any time via the unsubscribe
                link in any email
              </li>
              <li>
                Opt out of SMS notifications by replying STOP to any text
                message
              </li>
            </ul>
            <p className="text-muted-foreground">
              To exercise these rights, email us at{" "}
              <a
                href={`mailto:${BUSINESS_INFO.email}`}
                className="text-primary hover:underline"
              >
                {BUSINESS_INFO.email}
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">6. Cookies</h2>
            <p className="text-muted-foreground">
              Our website uses cookies for authentication (Clerk session
              management), analytics (Google Analytics), and payment session
              management (Stripe). You can control cookies through your browser
              settings. Disabling cookies may affect site functionality.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">
              7. Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground">
              Our website is not directed to children under 13. We do not
              knowingly collect personal information from children.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-heading">8. Contact Us</h2>
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
              Questions about your data?{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Use our contact form
              </Link>{" "}
              or email us directly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
