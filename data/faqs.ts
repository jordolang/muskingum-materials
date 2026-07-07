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
      "Use length x width x depth to estimate cubic yards, then convert to tons by material density. Use the calculators for a working estimate, or call with your dimensions and we'll figure it with you.",
    category: "Calculators & Coverage",
    sortOrder: 1,
  },
  {
    _id: "static-faq-2",
    question: "How do I convert tons to cubic yards?",
    answer:
      "The conversion depends on material density. A cubic yard of gravel often weighs around 1.3 to 1.5 tons. Use the tons-to-yards converter for a practical estimate, then confirm the final order with us.",
    category: "Calculators & Coverage",
    sortOrder: 2,
  },
  {
    _id: "static-faq-3",
    question: "Do you deliver?",
    answer:
      "Yes. Delivery is available throughout Central and Southeastern Ohio, and trucks can haul up to 20 tons per load. Call with your address and the material you need for a free estimate.",
    category: "Delivery & Pickup",
    sortOrder: 3,
  },
  {
    _id: "static-faq-4",
    question: "How is pricing handled?",
    answer:
      "Pricing is quoted by phone based on the material, quantity, and project. Call (740) 319-0183 with the product, estimated tonnage, location, and schedule for a free estimate.",
    category: "Ordering & Pricing",
    sortOrder: 4,
  },
  {
    _id: "static-faq-5",
    question: "Where can the truck dump material?",
    answer:
      "The dump location needs safe truck access, overhead clearance, stable ground, and room for the bed to raise. Driveways, jobsite entrances, and firm staging areas are usually best. We cannot dump where the truck may sink, tip, damage property, or hit wires, limbs, roofs, or signs.",
    category: "Delivery & Pickup",
    sortOrder: 5,
  },
  {
    _id: "static-faq-6",
    question: "Can I pick up materials myself?",
    answer:
      "Yes. Pull up to the scale house during business hours, get weighed in, get loaded, and get weighed out. You pay for the actual weight loaded on our state-approved scales. Bring a truck or trailer rated for the load.",
    category: "Delivery & Pickup",
    sortOrder: 6,
  },
  {
    _id: "static-faq-7",
    question: "What are your hours?",
    answer:
      "Muskingum Materials is open Monday through Friday, 7:30 AM to 4:00 PM. Hours can change for holidays or weather, so call ahead if you are making a long trip.",
    category: "Delivery & Pickup",
    sortOrder: 7,
  },
  {
    _id: "static-faq-8",
    question: "What forms of payment do you accept?",
    answer:
      "We accept Visa, Mastercard, Discover, Apple Pay, cash, and check.",
    category: "Ordering & Pricing",
    sortOrder: 8,
  },
  {
    _id: "static-faq-9",
    question: "Are your materials state approved?",
    answer:
      "Yes. We supply state approved sand, gravel, and aggregate, and our materials are ODOT approved. All loads are weighed on state-approved scales.",
    category: "Ordering & Pricing",
    sortOrder: 9,
  },
  {
    _id: "static-faq-10",
    question: "Can I order more than one material?",
    answer:
      "Yes, but separate materials usually need separate loads so they do not mix. Call and we can plan the order sequence so the right material arrives at the right stage.",
    category: "Ordering & Pricing",
    sortOrder: 10,
  },
  {
    _id: "static-faq-11",
    question: "What areas do you serve?",
    answer:
      "We are based in Zanesville and serve contractors, municipalities, and commercial customers throughout Central and Southeastern Ohio. Call even if you are outside the immediate area — larger orders can justify longer hauls.",
    category: "Delivery & Pickup",
    sortOrder: 11,
  },
  {
    _id: "static-faq-12",
    question: "What information should I have ready when I call?",
    answer:
      "Have the material if known, project dimensions, desired depth, delivery address, dump location, timing, and whether the site has tight access, overhead wires, steep grades, or soft ground. Estimated tonnage and load count are especially helpful.",
    category: "Ordering & Pricing",
    sortOrder: 12,
  },
];
