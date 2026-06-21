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
      "Use length x width x depth to estimate cubic yards, then convert to tons by material density. As a quick field rule, 1 ton of gravel often covers about 80 square feet at 2 inches deep. For driveways, bases, and drainage trenches, depth matters more than square footage alone, so use the calculators or call with your dimensions before ordering.",
    category: "Calculators & Coverage",
    sortOrder: 1,
  },
  {
    _id: "static-faq-2",
    question: "Which material should I use for a driveway?",
    answer:
      "For a strong driveway base, start with Crushed 304s Gravel or #304 Limestone because dense-graded material compacts tight. Washed #57 Gravel works well as a cleaner top layer with better drainage. Asphalt millings can be a budget-friendly surface for rural lanes and parking areas.",
    category: "Material Selection",
    sortOrder: 2,
  },
  {
    _id: "static-faq-3",
    question: "What is the difference between 304 and #57 stone?",
    answer:
      "304 is dense-graded, meaning it includes fines that lock together when compacted. It is the better choice for road base, driveway base, and paver base. #57 is cleaner, more open stone that drains water better and is commonly used for drainage, top dressing, landscaping, and around foundations.",
    category: "Material Selection",
    sortOrder: 3,
  },
  {
    _id: "static-faq-4",
    question: "What is washed gravel best for?",
    answer:
      "Washed gravel is best when you need drainage, a clean finish, or less fine dust. Washed #9 works for pipe bedding and tight spaces, Washed #8 is good for paths and paver leveling, and Washed #57 is the all-around choice for drainage, driveway top layers, and landscape beds.",
    category: "Material Selection",
    sortOrder: 4,
  },
  {
    _id: "static-faq-5",
    question: "Should I use limestone or gravel?",
    answer:
      "Use limestone when you want a bright, premium, consistent finish or a very stable crushed base. Use gravel when you want a natural stone look, economical fill, drainage performance, or a standard driveway material. If you are matching an existing drive, bring a photo or sample and we can help you get close.",
    category: "Material Selection",
    sortOrder: 5,
  },
  {
    _id: "static-faq-6",
    question: "What depth should gravel be for a driveway?",
    answer:
      "A light residential refresh may only need 2 to 3 inches of top stone. A new driveway usually needs 4 to 6 inches of compacted base, and weak or muddy ground may need a deeper base with larger stone below it. Heavy trucks, RVs, and poor subgrade usually require more depth.",
    category: "Project Planning",
    sortOrder: 6,
  },
  {
    _id: "static-faq-7",
    question: "What should I use for a French drain?",
    answer:
      "Washed #57 Gravel is the standard choice because it has open void space for water movement. Washed #9 can help with pipe bedding, and oversized washed gravel is useful where heavy water flow or erosion is a problem. Avoid dense-graded base stone inside the drain because fines can slow water flow.",
    category: "Drainage",
    sortOrder: 7,
  },
  {
    _id: "static-faq-8",
    question: "What material should go under pavers?",
    answer:
      "Use compacted 304 gravel or #304 limestone as the structural base, then add a thin leveling layer such as Washed #8 or Washed #9. The base carries the load; the small washed stone helps you dial in final grade and drainage.",
    category: "Project Planning",
    sortOrder: 8,
  },
  {
    _id: "static-faq-9",
    question: "What is bank run used for?",
    answer:
      "Bank Run is a natural unprocessed mix of sand, gravel, and small stone. It is economical for large fill, rough base, grading, and building up low areas. It is not the cleanest finish material, but it is a strong value when appearance is not the priority.",
    category: "Material Selection",
    sortOrder: 9,
  },
  {
    _id: "static-faq-10",
    question: "Can I use topsoil as fill?",
    answer:
      "Topsoil is for growing grass, garden beds, and finish grading, not structural fill. It contains organic material and can settle. For building up a base, use fill dirt, bank run, sand, or compactable aggregate, then reserve topsoil for the final growing layer.",
    category: "Material Selection",
    sortOrder: 10,
  },
  {
    _id: "static-faq-11",
    question: "How do I convert tons to cubic yards?",
    answer:
      "The conversion depends on material density. A cubic yard of gravel often weighs around 1.3 to 1.5 tons, but compacted limestone, sand, topsoil, and wet material can vary. Use the tons-to-yards converter for a practical estimate, then confirm the final order with us.",
    category: "Calculators & Coverage",
    sortOrder: 11,
  },
  {
    _id: "static-faq-12",
    question: "Why does depth change my tonnage so much?",
    answer:
      "Depth multiplies the whole project area. A 1,000 square foot drive at 2 inches is half the material of the same drive at 4 inches. That is why a thin refresh, a new base, and a heavy-duty commercial drive can have very different tonnage even when the footprint is identical.",
    category: "Calculators & Coverage",
    sortOrder: 12,
  },
  {
    _id: "static-faq-13",
    question: "Should I order extra material?",
    answer:
      "For irregular areas, soft spots, compaction loss, and hand spreading, a small cushion is smart. Many customers add 5% to 10% when the area is uneven or the depth varies. For clean rectangles with a controlled depth, the calculator estimate is usually close.",
    category: "Calculators & Coverage",
    sortOrder: 13,
  },
  {
    _id: "static-faq-14",
    question: "Do you deliver, and how much does it cost?",
    answer:
      "Yes. Delivery is available throughout Southeast Ohio, and trucks can haul up to 20 tons per load. Delivery cost depends on distance, load size, truck access, and scheduling. Call with your address or ZIP code and the material you need for an exact quote.",
    category: "Delivery & Pickup",
    sortOrder: 14,
  },
  {
    _id: "static-faq-15",
    question: "Where can the truck dump material?",
    answer:
      "The dump location needs safe truck access, overhead clearance, stable ground, and room for the bed to raise. Driveways, jobsite entrances, and firm staging areas are usually best. We cannot dump where the truck may sink, tip, damage property, or hit wires, limbs, roofs, or signs.",
    category: "Delivery & Pickup",
    sortOrder: 15,
  },
  {
    _id: "static-faq-16",
    question: "Can I pick up materials myself?",
    answer:
      "Yes. Pull up to the scale house during business hours, get weighed in, get loaded, and get weighed out. You pay for the actual weight loaded. Bring a truck or trailer rated for the load, and remember that even a small-looking scoop of stone can be very heavy.",
    category: "Delivery & Pickup",
    sortOrder: 16,
  },
  {
    _id: "static-faq-17",
    question: "How much can my pickup truck haul?",
    answer:
      "Most half-ton pickups should not be treated like one-ton dump trucks. Payload depends on the exact truck, tires, trailer, and rating sticker. Check your door jamb payload rating before pickup. If you are unsure, delivery is often safer and cheaper than overloading a vehicle.",
    category: "Delivery & Pickup",
    sortOrder: 17,
  },
  {
    _id: "static-faq-18",
    question: "What are your hours?",
    answer:
      "Muskingum Materials is open Monday through Friday, 7:30 AM to 4:00 PM. Hours can change for holidays, weather, or special circumstances, so call ahead if you are making a long trip or need a specific pickup window.",
    category: "Delivery & Pickup",
    sortOrder: 18,
  },
  {
    _id: "static-faq-19",
    question: "What forms of payment do you accept?",
    answer:
      "We accept Visa, Mastercard, Discover, Apple Pay, cash, and check. Ohio sales tax applies to taxable purchases, and card payments include the current processing fee listed on the pricing page.",
    category: "Ordering & Pricing",
    sortOrder: 19,
  },
  {
    _id: "static-faq-20",
    question: "Do you offer contractor or bulk pricing?",
    answer:
      "Yes. Large projects, repeat contractor work, and high-volume orders may qualify for special pricing. Call with the product, estimated tonnage, location, and schedule so we can price the job correctly.",
    category: "Ordering & Pricing",
    sortOrder: 20,
  },
  {
    _id: "static-faq-21",
    question: "Are online prices final?",
    answer:
      "Online prices are a useful planning reference, but materials, tax, delivery, processing fees, and availability can change. For the most accurate number, confirm the order details before dispatch or pickup.",
    category: "Ordering & Pricing",
    sortOrder: 21,
  },
  {
    _id: "static-faq-22",
    question: "Can I order more than one material?",
    answer:
      "Yes, but separate materials usually need separate loads so they do not mix. For layered projects like a driveway base and top stone, we can help plan the order sequence so the right material arrives at the right stage.",
    category: "Ordering & Pricing",
    sortOrder: 22,
  },
  {
    _id: "static-faq-23",
    question: "What areas do you serve?",
    answer:
      "We are based in Zanesville and regularly serve customers around Muskingum County and surrounding Southeast Ohio communities. Larger orders can justify longer hauls, so call even if you are outside the immediate area.",
    category: "Delivery & Pickup",
    sortOrder: 23,
  },
  {
    _id: "static-faq-24",
    question: "How should I prepare before delivery?",
    answer:
      "Choose a dump spot, clear vehicles and debris, check overhead wires or branches, mark soft ground, and make sure someone on site can confirm placement. If the material will be spread later, dump it where equipment can reach it without blocking traffic.",
    category: "Project Planning",
    sortOrder: 24,
  },
  {
    _id: "static-faq-25",
    question: "Do I need fabric under gravel?",
    answer:
      "Landscape fabric or geotextile can help separate stone from muddy soil and slow weed growth, especially under paths, landscaping stone, and soft driveway areas. It is not a substitute for the right base depth, drainage, or compaction.",
    category: "Project Planning",
    sortOrder: 25,
  },
  {
    _id: "static-faq-26",
    question: "How do I keep gravel from washing out?",
    answer:
      "Control water first. Crown the driveway or slope the surface, add ditches or drains where needed, use angular compactable base stone, and avoid sending roof or hillside runoff straight across loose gravel. In heavy flow areas, larger stone may be needed.",
    category: "Drainage",
    sortOrder: 26,
  },
  {
    _id: "static-faq-27",
    question: "Why does my driveway keep getting potholes?",
    answer:
      "Potholes usually come from trapped water, weak base, poor compaction, or traffic pushing loose stone out of place. Filling the hole alone may not last unless the soft material is removed, the base is rebuilt, and water is directed away.",
    category: "Maintenance",
    sortOrder: 27,
  },
  {
    _id: "static-faq-28",
    question: "Can you help me choose material if I am not sure?",
    answer:
      "Yes. Use the material recommendation wizard for a fast starting point, then call with project type, dimensions, photos if available, access conditions, and whether you need pickup or delivery. We can help match the product to the real job instead of guessing.",
    category: "Material Selection",
    sortOrder: 28,
  },
  {
    _id: "static-faq-29",
    question: "What information should I have ready when I call?",
    answer:
      "Have the material if known, project dimensions, desired depth, delivery address, dump location, timing, and whether the site has tight access, overhead wires, steep grades, or soft ground. For quotes, estimated tonnage and load count are especially helpful.",
    category: "Ordering & Pricing",
    sortOrder: 29,
  },
  {
    _id: "static-faq-30",
    question: "Can I use your calculators before I order?",
    answer:
      "Yes. The gravel calculator, tons-to-yards converter, and coverage chart are built for planning. They help you estimate material, compare depths, and avoid under-ordering. Treat the result as a strong estimate and confirm edge cases with us before purchase.",
    category: "Calculators & Coverage",
    sortOrder: 30,
  },
];
