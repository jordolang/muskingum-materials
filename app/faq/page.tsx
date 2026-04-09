import Link from "next/link";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BUSINESS_INFO } from "@/data/business";
import { generateFAQPageSchema, toJsonLd } from "@/lib/seo/structured-data";
import { generateFAQMetadata } from "@/lib/seo/metadata";

export const metadata = generateFAQMetadata();

const FAQS = [
  {
    category: "General",
    items: [
      {
        q: "Where is Muskingum Materials located?",
        a: `We're located at ${BUSINESS_INFO.address}, ${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} ${BUSINESS_INFO.zip}.`,
      },
      {
        q: "What are your business hours?",
        a: `We're open ${BUSINESS_INFO.hours}. We're closed on weekends.`,
      },
      {
        q: "Is Muskingum Materials family-owned?",
        a: "Yes! We're a family-owned and operated business serving Southeast Ohio with quality sand, soil, and gravel products.",
      },
    ],
  },
  {
    category: "Products",
    items: [
      {
        q: "What products do you carry?",
        a: "We carry a wide range of sand, gravel, soil, and stone products including Bank Run, Fill Dirt, Fill Sand, Topsoil, various grades of washed gravel (#8, #9, #57), 304 Crushed Gravel, Limestone, Screenings, and Landscape Rock.",
      },
      {
        q: "Do you have washed products?",
        a: "Yes! We offer several washed products including #8 Fractured Gravel (Washed), #9 Gravel (Washed), #8 Gravel (Washed), #57 Gravel (Washed), and Oversized Gravel (Washed).",
      },
      {
        q: "What's the difference between #57 and #8 gravel?",
        a: '#57 gravel is 3/4" to 1" in size, great for driveways, drainage, and landscaping. #8 gravel is 3/8" in size, perfect for concrete mix and decorative applications.',
      },
    ],
  },
  {
    category: "Pricing & Payment",
    items: [
      {
        q: "How much does gravel cost?",
        a: "Prices vary by product. #57 Gravel (Washed) is $15.00/ton, 304 Crushed Gravel is $20.00/ton, and #8 Fractured Gravel (Washed) is $28.00/ton. Call for the most current pricing.",
      },
      {
        q: "What payment methods do you accept?",
        a: `We accept ${BUSINESS_INFO.paymentMethods.join(", ")}. Please note there is a ${(BUSINESS_INFO.creditProcessingFee * 100).toFixed(1)}% credit card processing fee per ticket.`,
      },
      {
        q: "Is there sales tax?",
        a: `Yes, Ohio sales tax of ${(BUSINESS_INFO.taxRate * 100).toFixed(2)}% applies to all purchases.`,
      },
      {
        q: "Do you offer volume discounts?",
        a: "Yes! We offer large-quantity pricing for large projects. Contact us for a custom quote on bulk orders.",
      },
    ],
  },
  {
    category: "Delivery",
    items: [
      {
        q: "Do you deliver?",
        a: "Yes! We offer delivery services throughout Southeast Ohio. Our trucks can handle loads up to 20 tons per trip.",
      },
      {
        q: "How much does delivery cost?",
        a: "Delivery rates depend on distance and quantity. Call (740) 319-0183 for current delivery rates.",
      },
      {
        q: "Can I pick up materials myself?",
        a: "Absolutely! You can come to our location at 1133 Ellis Dam Rd, Zanesville. We have state-approved scales on-site for accurate weights and modern equipment for fast loading.",
      },
    ],
  },
];

export default function FAQPage() {
  // Flatten all FAQs for structured data
  const allFaqs = FAQS.flatMap((section) =>
    section.items.map((item) => ({
      question: item.q,
      answer: item.a,
    }))
  );

  const faqSchema = generateFAQPageSchema(allFaqs);

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

        {FAQS.map((section) => (
          <div key={section.category} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{section.category}</h2>
            <Accordion type="single" collapsible className="w-full">
              {section.items.map((faq, i) => (
                <AccordionItem key={i} value={`${section.category}-${i}`}>
                  <AccordionTrigger className="text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
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
            <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
              <Button className="gap-2">
                <Phone className="h-4 w-4" />
                Call {BUSINESS_INFO.phone}
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
