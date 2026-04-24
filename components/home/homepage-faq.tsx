import { sanityClient } from "@/lib/sanity/client";
import { faqQuery } from "@/lib/sanity/queries";
import { STATIC_FAQS } from "@/data/faqs";
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
    const allFaqs = await sanityClient.fetch<FAQ[]>(
      faqQuery,
      {},
      { next: { tags: ["faq"] } }
    );
    if (Array.isArray(allFaqs) && allFaqs.length > 0) {
      faqs = allFaqs;
    }
  } catch (error) {
    console.error("Failed to fetch homepage FAQs from Sanity:", error);
  }

  // Fall back to static FAQs if Sanity is empty or unavailable.
  if (faqs.length === 0) {
    faqs = STATIC_FAQS;
  }

  // Show only the first 6 on the homepage.
  const homepageFaqs = faqs.slice(0, 6);

  return <HomepageFAQClient faqs={homepageFaqs} />;
}
