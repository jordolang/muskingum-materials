import Link from "next/link";
import { ArrowRight, Calculator, MapPinned, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_INFO } from "@/data/business";
import { STATIC_FAQS } from "@/data/faqs";
import { FAQBento } from "@/components/faq/faq-bento";
import { generateFAQPageSchema, toJsonLd } from "@/lib/seo/structured-data";
import { generateFAQMetadata } from "@/lib/seo/metadata";
import { sanityClient } from "@/lib/sanity/client";
import { faqQuery, siteSettingsQuery } from "@/lib/sanity/queries";

// TEMPORARY: Force dynamic rendering to allow build to complete for bundle verification
export const dynamic = 'force-dynamic';
// export const revalidate = 3600; // Revalidate every hour (ISR)

export const metadata = generateFAQMetadata();

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

interface SiteSettings {
  title: string;
  description: string;
  phone: string;
  altPhone?: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export default async function FAQPage() {
  let sanityFaqs: FAQ[] = [];
  let siteSettings: SiteSettings | null = null;

  try {
    const [fetchedFaqs, fetchedSettings] = await Promise.all([
      sanityClient.fetch<FAQ[]>(faqQuery, {}, { next: { tags: ['faq'] } }),
      sanityClient.fetch<SiteSettings>(siteSettingsQuery, {}, { next: { tags: ['site-settings'] } }),
    ]);
    sanityFaqs = fetchedFaqs ?? [];
    siteSettings = fetchedSettings ?? null;
  } catch (error) {
    console.error("Failed to fetch FAQs/settings from Sanity:", error);
  }

  // Fallback to static data if Sanity settings unavailable
  const phone = siteSettings?.phone || BUSINESS_INFO.phone;
  const faqMap = new Map<string, FAQ>();

  for (const faq of STATIC_FAQS) {
    faqMap.set(faq.question.toLowerCase(), faq);
  }

  for (const faq of sanityFaqs) {
    faqMap.set(faq.question.toLowerCase(), faq);
  }

  const faqs = Array.from(faqMap.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder || a.question.localeCompare(b.question),
  );

  // Structured data from the full displayed FAQ set.
  const faqSchema = generateFAQPageSchema(
    faqs.map((f) => ({ question: f.question, answer: f.answer })),
  );

  return (
    <div className="ambient-glow py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(faqSchema) }}
      />
      <div className="container">
        <div className="mx-auto mb-10 max-w-4xl text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
            <Sparkles className="h-4 w-4" />
            Materials, delivery, coverage, and project know-how
          </div>
          <h1 className="text-balance text-4xl font-bold font-heading md:text-6xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
            A field guide for choosing the right gravel, limestone, sand, soil, coverage depth, delivery plan, and order size before the truck rolls.
          </p>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          <Link
            href="/recommendations"
            className="group rounded-lg border border-stone-200 bg-white p-5 shadow-float transition-transform hover:-translate-y-1"
          >
            <MapPinned className="mb-4 h-6 w-6 text-primary" />
            <h2 className="font-semibold">Find the right material</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the project wizard when you know the job but not the product.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Start wizard <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
          <Link
            href="/calculators"
            className="group rounded-lg border border-stone-200 bg-white p-5 shadow-float transition-transform hover:-translate-y-1"
          >
            <Calculator className="mb-4 h-6 w-6 text-primary" />
            <h2 className="font-semibold">Calculate tons and yards</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Estimate depth, coverage, tonnage, cubic yards, and rough cost.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Open calculators <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
          <div className="rounded-lg border border-stone-200 bg-stone-900 p-5 text-white shadow-float">
            <Phone className="mb-4 h-6 w-6 text-amber-400" />
            <h2 className="font-semibold">Confirm the edge cases</h2>
            <p className="mt-2 text-sm text-white/70">
              Soft ground, steep access, drainage, and multi-load orders deserve a quick call.
            </p>
            <a
              href={`tel:${phone.replace(/\D/g, "")}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-300"
            >
              Call {phone} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <FAQBento faqs={faqs} />

        <div className="mt-12 rounded-lg bg-muted/50 p-8 text-center">
          <h2 className="text-xl font-semibold mb-3">
            Still Have Questions?
          </h2>
          <p className="text-muted-foreground mb-4">
            We&apos;re happy to help! Reach out to us directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`tel:${phone.replace(/\D/g, "")}`}>
              <Button className="gap-2">
                <Phone className="h-4 w-4" />
                Call {phone}
              </Button>
            </a>
            <Link href="/contact">
              <Button variant="outline">Send Us a Message</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
