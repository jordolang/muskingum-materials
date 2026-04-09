"use client";

import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const HOME_FAQS = [
  {
    q: "What products do you carry?",
    a: "We carry over 15 types of sand, gravel, soil, and stone products including Bank Run, Fill Dirt, Fill Sand, Topsoil, various grades of washed gravel (#8, #9, #57), 304 Crushed Gravel, Limestone, Screenings, and Landscape Rock.",
  },
  {
    q: "How much does gravel cost?",
    a: "Prices start at $2.00/ton for Bank Run and Fill Dirt, up to $28.00/ton for specialty washed gravel. Our most popular product, #57 Gravel (Washed), is $15.00/ton. Visit our Products & Pricing page for the complete list.",
  },
  {
    q: "Do you deliver?",
    a: "Yes! We deliver throughout Southeast Ohio. Our trucks can carry up to 20 tons per load. Call (740) 319-0183 for delivery rates based on your location and quantity.",
  },
  {
    q: "Can I order materials online?",
    a: "Absolutely! Use our online ordering system to select products, calculate how much material you need, and pay securely with a credit card, Apple Pay, or Google Pay. You can also call to place orders directly.",
  },
  {
    q: "How do I know how much material I need?",
    a: "Use our Material Calculator on the Order page. Enter your project dimensions (length x width x depth) or select from common presets like driveways and patios. It'll estimate tons needed and number of truckloads.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept Visa, Mastercard, Discover, Apple Pay, cash, and check. Note: a 4.5% credit card processing fee applies per transaction. Ohio sales tax of 7.25% is added to all purchases.",
  },
];

export function HomepageFAQ() {
  return (
    <div className="max-w-3xl mx-auto">
      <Accordion type="single" collapsible className="w-full">
        {HOME_FAQS.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border/50">
            <AccordionTrigger className="text-left text-base hover:text-amber-700 py-5">
              <span className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                {faq.q}
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pl-8 pb-5 leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="text-center mt-8">
        <Link href="/faq">
          <Button variant="outline" className="gap-2">
            View All FAQs
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
