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
  return (
    <div className="max-w-3xl mx-auto">
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq) => (
          <AccordionItem key={faq._id} value={faq._id} className="border-b border-border/50">
            <AccordionTrigger className="text-left text-base hover:text-amber-700 py-5">
              <span className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                {faq.question}
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pl-8 pb-5 leading-relaxed">
              {faq.answer}
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
