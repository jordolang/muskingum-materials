import Link from "next/link";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_INFO } from "@/data/business";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { generateFAQPageSchema, toJsonLd } from "@/lib/seo/structured-data";
import { generateFAQMetadata } from "@/lib/seo/metadata";
import { sanityClient } from "@/lib/sanity/client";
import { faqQuery, siteSettingsQuery } from "@/lib/sanity/queries";

export const revalidate = 3600; // Revalidate every hour (ISR)

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
  let faqs: FAQ[] = [];
  let siteSettings: SiteSettings | null = null;

  try {
    [faqs, siteSettings] = await Promise.all([
      sanityClient.fetch<FAQ[]>(faqQuery, {}, { next: { tags: ['faq'] } }),
      sanityClient.fetch<SiteSettings>(siteSettingsQuery, {}, { next: { tags: ['site-settings'] } }),
    ]);
  } catch (error) {
    console.error("Failed to fetch FAQs/settings from Sanity:", error);
  }

  // Fallback to static data if Sanity settings unavailable
  const phone = siteSettings?.phone || BUSINESS_INFO.phone;

  // Group FAQs by category
  const groupedFAQs = faqs.reduce(
    (acc, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    },
    {} as Record<string, FAQ[]>
  );

  // Structured data from whichever FAQs we actually have (Sanity, or empty).
  const faqSchema = generateFAQPageSchema(
    faqs.map((f) => ({ question: f.question, answer: f.answer })),
  );

  return (
    <div className="py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(faqSchema) }}
      />
      <div className="container max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground">
            Find answers to common questions about our products, pricing, and services.
          </p>
        </div>

        {Object.entries(groupedFAQs).map(([category, items]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{category}</h2>
            <Accordion type="single" collapsible className="w-full">
              {items.map((faq) => (
                <AccordionItem key={faq._id} value={faq._id}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}

        <div className="text-center mt-12 p-8 bg-muted/50 rounded-lg">
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
