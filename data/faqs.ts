export interface StaticFAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

export const STATIC_FAQS: StaticFAQ[] = [
  {
    _id: "static-faq-1",
    question: "How much material do I need for my project?",
    answer:
      "A good rule of thumb is 1 ton of gravel or sand covers roughly 80 sq. ft. at 2 inches deep. Give us a call with your dimensions and we'll help you calculate the exact tonnage — we'd rather you order right the first time than have leftovers.",
    category: "Ordering",
    sortOrder: 1,
  },
  {
    _id: "static-faq-2",
    question: "Do you deliver, and how much does it cost?",
    answer:
      "Yes, we deliver throughout Southeast Ohio. Delivery cost depends on distance, load size, and truck type. Call us with your ZIP code and we'll give you an exact quote — most local deliveries are dispatched within 24–48 hours.",
    category: "Delivery",
    sortOrder: 2,
  },
  {
    _id: "static-faq-3",
    question: "Can I pick up materials myself?",
    answer:
      "Absolutely. Pull up to the scale house Monday–Friday, 7:30 AM–4:00 PM, and our team will weigh you in, load your truck or trailer, and weigh you out. You only pay for what you haul.",
    category: "Pickup",
    sortOrder: 3,
  },
  {
    _id: "static-faq-4",
    question: "What forms of payment do you accept?",
    answer:
      "We accept cash, check, and all major credit and debit cards at the scale house. For commercial accounts and larger orders, we can set up invoicing — just ask when you call.",
    category: "Payment",
    sortOrder: 4,
  },
  {
    _id: "static-faq-5",
    question: "Do you offer contractor or bulk pricing?",
    answer:
      "Yes. Contractors and customers ordering in bulk qualify for volume discounts. Call us or stop by the office to set up an account and get pricing tailored to your projects.",
    category: "Pricing",
    sortOrder: 5,
  },
  {
    _id: "static-faq-6",
    question: "What areas do you serve?",
    answer:
      "We're based in Zanesville and regularly deliver throughout Muskingum, Perry, Licking, Coshocton, Guernsey, and Morgan counties. If you're outside that range, give us a call — we often make deliveries further out for larger orders.",
    category: "Service Area",
    sortOrder: 6,
  },
];
