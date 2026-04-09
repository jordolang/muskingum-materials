import { sanityClient } from "@/lib/sanity/client";
import { faqQuery } from "@/lib/sanity/queries";
import { HomepageFAQClient } from "./homepage-faq-client";

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

export async function HomepageFAQ() {
  let faqs: FAQ[] = [];

  try {
    const allFaqs = await sanityClient.fetch<FAQ[]>(faqQuery, {}, { next: { tags: ['faq'] } });
    // Show only first 6 FAQs on homepage
    faqs = allFaqs.slice(0, 6);
  } catch (error) {
    console.error("Failed to fetch homepage FAQs from Sanity:", error);
  }

  // If no FAQs available, return null or a fallback message
  if (faqs.length === 0) {
    return null;
  }

  return <HomepageFAQClient faqs={faqs} />;
}
