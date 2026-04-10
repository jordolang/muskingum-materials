"use client";

import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

interface HomepageFAQClientProps {
  faqs: FAQ[];
}

export function HomepageFAQClient({ faqs }: HomepageFAQClientProps) {
  if (faqs.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center text-muted-foreground">
        No FAQs available right now. Give us a call and we&apos;ll answer any
        question you have.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-0 shadow-lg bg-card overflow-hidden">
        <Accordion
          type="single"
          collapsible
          className="w-full divide-y divide-border/60"
        >
          {faqs.map((faq) => (
            <AccordionItem
              key={faq._id}
              value={faq._id}
              className="border-0 px-6 group data-[state=open]:bg-amber-50/60 transition-colors"
            >
              <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline group-data-[state=open]:text-amber-800">
                <span className="flex items-start gap-3 pr-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 group-data-[state=open]:bg-amber-600 group-data-[state=open]:text-white transition-colors">
                    <HelpCircle className="h-4 w-4" />
                  </span>
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pl-10 pb-5 pr-4 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

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
