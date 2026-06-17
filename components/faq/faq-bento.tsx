"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight,
  Calculator,
  ChevronLeft,
  ClipboardList,
  Droplets,
  HelpCircle,
  PackageCheck,
  Phone,
  RefreshCw,
  Ruler,
  Sparkles,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQBentoItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

interface FAQBentoProps {
  faqs: FAQBentoItem[];
}

const categoryIcons = {
  "Material Selection": Sparkles,
  "Calculators & Coverage": Calculator,
  "Project Planning": Ruler,
  Drainage: Droplets,
  "Delivery & Pickup": Truck,
  "Ordering & Pricing": PackageCheck,
  Maintenance: RefreshCw,
} satisfies Record<string, ComponentType<{ className?: string }>>;

const categoryStyles = {
  "Material Selection": "border-amber-300/70 bg-amber-50/90 text-amber-950",
  "Calculators & Coverage": "border-sky-300/70 bg-sky-50/90 text-sky-950",
  "Project Planning": "border-stone-300/80 bg-stone-50/95 text-stone-950",
  Drainage: "border-cyan-300/70 bg-cyan-50/90 text-cyan-950",
  "Delivery & Pickup": "border-emerald-300/70 bg-emerald-50/90 text-emerald-950",
  "Ordering & Pricing": "border-orange-300/70 bg-orange-50/90 text-orange-950",
  Maintenance: "border-zinc-300/80 bg-zinc-50/95 text-zinc-950",
} satisfies Record<string, string>;

const categoryBackStyles = {
  "Material Selection": "from-amber-950 via-stone-900 to-amber-800",
  "Calculators & Coverage": "from-sky-950 via-stone-900 to-sky-800",
  "Project Planning": "from-stone-950 via-neutral-900 to-stone-800",
  Drainage: "from-cyan-950 via-stone-900 to-cyan-800",
  "Delivery & Pickup": "from-emerald-950 via-stone-900 to-emerald-800",
  "Ordering & Pricing": "from-orange-950 via-stone-900 to-orange-800",
  Maintenance: "from-zinc-950 via-stone-900 to-zinc-800",
} satisfies Record<string, string>;

function getCategoryIcon(category: string) {
  return categoryIcons[category as keyof typeof categoryIcons] ?? HelpCircle;
}

function getCategoryStyle(category: string) {
  return categoryStyles[category as keyof typeof categoryStyles] ?? "border-border bg-card text-card-foreground";
}

function getCategoryBackStyle(category: string) {
  return categoryBackStyles[category as keyof typeof categoryBackStyles] ?? "from-stone-950 via-stone-900 to-stone-800";
}

function getSpanClass(index: number) {
  const pattern = [
    "lg:col-span-2 lg:row-span-2",
    "",
    "",
    "lg:col-span-2",
    "",
    "",
    "lg:col-span-2",
    "",
    "",
    "",
  ];

  return pattern[index % pattern.length];
}

export function FAQBento({ faqs }: FAQBentoProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(faqs.map((faq) => faq.category)))],
    [faqs],
  );

  const visibleFaqs = useMemo(
    () => (category === "All" ? faqs : faqs.filter((faq) => faq.category === category)),
    [category, faqs],
  );

  return (
    <div className="space-y-8">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((item) => {
          const selected = item === category;
          const Icon = item === "All" ? ClipboardList : getCategoryIcon(item);

          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                setCategory(item);
                setActiveId(null);
              }}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                selected
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:border-amber-400 hover:text-stone-950",
              )}
              aria-pressed={selected}
            >
              <Icon className="h-4 w-4" />
              {item}
            </button>
          );
        })}
      </div>

      <div className="grid auto-rows-[minmax(280px,auto)] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {visibleFaqs.map((faq, index) => {
          const open = activeId === faq._id;
          const Icon = getCategoryIcon(faq.category);

          return (
            <button
              key={faq._id}
              type="button"
              onClick={() => setActiveId(open ? null : faq._id)}
              className={cn(
                "group relative min-h-[280px] text-left [perspective:1200px]",
                getSpanClass(index),
              )}
              aria-expanded={open}
            >
              <span
                className={cn(
                  "absolute inset-0 rounded-lg transition-transform duration-500 [transform-style:preserve-3d]",
                  open && "[transform:rotateY(180deg)]",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-0 flex flex-col justify-between overflow-hidden rounded-lg border p-5 shadow-float [backface-visibility:hidden]",
                    getCategoryStyle(faq.category),
                  )}
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white/80 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
                      {faq.category}
                    </span>
                  </span>

                  <span className="space-y-4">
                    <span className="block text-balance text-xl font-bold leading-tight md:text-2xl">
                      {faq.question}
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold">
                      Tap to reveal answer
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </span>
                </span>

                <span
                  className={cn(
                    "absolute inset-0 flex flex-col justify-between overflow-hidden rounded-lg bg-gradient-to-br p-5 text-white shadow-float [backface-visibility:hidden] [transform:rotateY(180deg)]",
                    getCategoryBackStyle(faq.category),
                  )}
                >
                  <span className="flex items-center justify-between gap-4 text-white/80">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                      <Icon className="h-4 w-4" />
                      {faq.category}
                    </span>
                    <ChevronLeft className="h-5 w-5" />
                  </span>

                  <span className="block text-sm leading-6 text-white/90 md:text-base">
                    {faq.answer}
                  </span>

                  <span className="text-xs font-semibold text-white/70">
                    Tap again to flip back
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-float md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-xl font-bold font-heading">Need a human call on the material?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Send the dimensions, depth, access notes, and photos if you have them. The right answer is usually a mix of material, depth, drainage, and delivery access.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Phone className="h-4 w-4" />
          Ask the Yard
        </Link>
      </div>
    </div>
  );
}
