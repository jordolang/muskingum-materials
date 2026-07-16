import Link from "next/link";
import Image from "next/image";
import { Fira_Sans } from "next/font/google";
import {
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Shield,
  Map,
  Clock,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { BUSINESS_INFO } from "@/data/business";
import { generateLocalBusinessSchema, toJsonLd } from "@/lib/seo/structured-data";
import { generateHomeMetadata } from "@/lib/seo/metadata";

// Generate SEO metadata with canonical URL, OG images, and Twitter cards
export const metadata = generateHomeMetadata();

// Hero contact info uses Fira Sans — a bolder humanist face (Ubuntu-like
// character) that sets it apart from the Inter body copy. Homepage-only,
// so it's loaded here rather than in the root layout; not preloaded to
// keep the LCP hero image first in line.
const fontContact = Fira_Sans({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  preload: false,
});

// The simplified homepage is fully static — all copy renders from the
// canonical BUSINESS_INFO record, no database or CMS content. No pricing shown.
const TRUST_BADGES = [
  { icon: Shield, label: "ODOT Approved Materials" },
  { icon: Map, label: "Central & Southeastern Ohio" },
];

const FACILITY_PHOTOS = [
  { img: "piles", label: "Aggregate Stockpiles" },
  { img: "feeder", label: "Processing" },
  { img: "equipment", label: "Loading" },
];

export default function HomePage() {
  const phoneHref = `tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`;
  const localBusinessSchema = generateLocalBusinessSchema();

  return (
    <>
      {/* Structured Data - LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(localBusinessSchema) }}
      />

      {/* Hero — full-bleed, cross-fading carousel of yard photography (30s loop).
          Runs edge to edge with square corners; the photos carry the section, so
          the only overlay is a neutral scrim for type contrast. */}
      <section>
        <div className="relative flex min-h-[600px] w-full items-center overflow-hidden">
          <HeroCarousel />
          <div className="absolute inset-0 hero-scrim" />
          <div className="relative z-10 w-full px-7 py-20 text-center sm:px-12">
            <div className="mx-auto max-w-3xl text-white">
              <h1 className="mb-4 font-heading text-5xl font-bold leading-tight md:text-7xl">
                Muskingum Materials
              </h1>
              <p className="mb-8 font-display text-2xl uppercase tracking-wide text-white/95 md:text-3xl">
                ODOT Approved Sand, Gravel &amp; Aggregate Supplier
              </p>
              <div className={`mb-9 space-y-2 text-lg ${fontContact.className}`}>
                <a
                  href={phoneHref}
                  className="flex items-center justify-center gap-3 font-bold hover:text-amber-400 transition-colors"
                >
                  <Phone className="h-5 w-5 text-amber-400" />
                  {BUSINESS_INFO.phone}
                </a>
                <a
                  href={`mailto:${BUSINESS_INFO.email}`}
                  className="flex items-center justify-center gap-3 font-semibold hover:text-amber-400 transition-colors"
                >
                  <Mail className="h-5 w-5 text-amber-400" />
                  {BUSINESS_INFO.email}
                </a>
                {/* Icon flows inline with the text so it stays beside the
                    street address even when it wraps on narrow screens. */}
                <p className="font-semibold">
                  <MapPin
                    aria-hidden
                    className="mr-2.5 inline h-5 w-5 align-[-0.2em] text-amber-400"
                  />
                  {BUSINESS_INFO.address}, {BUSINESS_INFO.city},{" "}
                  {BUSINESS_INFO.state} {BUSINESS_INFO.zip}
                </p>
              </div>
              <a href={phoneHref} className="inline-block max-w-full">
                {/* The Button base sets whitespace-nowrap, which pushed this
                    long label off the edge on phones — allow wrapping and let
                    the height grow so it always fits the viewport. */}
                <Button
                  size="lg"
                  className="h-auto max-w-full gap-2 whitespace-normal bg-amber-600 px-6 py-3 font-semibold text-white shadow-glow hover:bg-amber-700 sm:px-8"
                >
                  <Phone className="h-5 w-5 shrink-0" />
                  Call for Material Availability &amp; Free Estimates
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="relative z-20 -mt-7 px-3 sm:px-5">
        <div className="glass-dark mx-auto grid max-w-3xl grid-cols-1 gap-2 rounded-3xl bg-stone-900/85 p-3 text-white shadow-float sm:grid-cols-2">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center justify-center gap-2.5 rounded-2xl px-3 py-2.5 text-center"
            >
              <Icon className="h-5 w-5 shrink-0 text-amber-400" />
              <span className="text-sm font-bold uppercase tracking-wide">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Business Information — hours, offerings, location, and payment */}
      <section className="py-16 sm:py-20">
        <div className="container max-w-5xl">
          <h2 className="mb-3 text-center font-heading text-3xl font-bold">
            Business Information
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center leading-relaxed text-muted-foreground">
            {BUSINESS_INFO.description}
          </p>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* What we offer */}
            <div className="rounded-3xl border border-stone-300/70 bg-background p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-600" />
                <h3 className="font-heading text-lg font-bold">What We Offer</h3>
              </div>
              <ul className="space-y-2.5">
                {BUSINESS_INFO.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Hours */}
            <div className="rounded-3xl border border-stone-300/70 bg-background p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2.5">
                <Clock className="h-5 w-5 shrink-0 text-amber-600" />
                <h3 className="font-heading text-lg font-bold">Hours</h3>
              </div>
              <ul className="space-y-2 text-sm">
                {Object.entries(BUSINESS_INFO.hoursParsed).map(([day, hours]) => (
                  <li
                    key={day}
                    className="flex justify-between border-b border-stone-200 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="font-medium capitalize">{day}</span>
                    <span className="text-muted-foreground">{hours}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Location & service area */}
            <div className="rounded-3xl border border-stone-300/70 bg-background p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2.5">
                <MapPin className="h-5 w-5 shrink-0 text-amber-600" />
                <h3 className="font-heading text-lg font-bold">
                  Location &amp; Service Area
                </h3>
              </div>
              <p className="mb-2 text-sm font-medium">
                {BUSINESS_INFO.address}, {BUSINESS_INFO.city},{" "}
                {BUSINESS_INFO.state} {BUSINESS_INFO.zip}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Serving contractors, municipalities, and commercial customers
                throughout {BUSINESS_INFO.serviceArea}.
              </p>
            </div>

            {/* Payment methods */}
            <div className="rounded-3xl border border-stone-300/70 bg-background p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2.5">
                <CreditCard className="h-5 w-5 shrink-0 text-amber-600" />
                <h3 className="font-heading text-lg font-bold">
                  Payment Methods
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_INFO.paymentMethods.map((method) => (
                  <span
                    key={method}
                    className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-semibold"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Call for pricing and availability.
            </p>
            <Link href="/products">
              <Button variant="outline" className="gap-2">
                Full Product List
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ODOT / supplier credibility */}
      <section className="bg-stone-100 py-14">
        <div className="container max-w-3xl text-center">
          <h2 className="mb-4 font-heading text-3xl font-bold">
            ODOT Qualified Supplier
          </h2>
          <p className="mb-6 text-muted-foreground">
            Supplying state approved sand, gravel, and aggregate to
            contractors, municipalities, and commercial customers throughout
            Central and Southeastern Ohio. Materials weighed on state-approved
            scales. Loads up to 20 tons.
          </p>
          <a
            href={BUSINESS_INFO.odot.listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800"
          >
            Learn about ODOT aggregate certification
          </a>
        </div>
      </section>

      {/* Facility photos */}
      <section className="py-16">
        <div className="container">
          <h2 className="mb-8 text-center font-heading text-3xl font-bold">
            The Yard
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {FACILITY_PHOTOS.map((item) => (
              <Link
                key={item.img}
                href="/gallery"
                className="group relative block aspect-[4/3] overflow-hidden rounded-3xl shadow-float"
              >
                <Image
                  src={`/images/photos/${item.img}.jpg`}
                  alt={item.label}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                <span className="absolute bottom-4 left-4 text-sm font-bold tracking-wide text-white">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/gallery">
              <Button variant="outline" className="gap-2">
                View Gallery
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="px-3 pb-16 sm:px-5 sm:pb-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-stone-900 px-6 py-14 text-center text-white shadow-float">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 0%, rgba(245,158,11,0.28), transparent 70%)",
            }}
          />
          <div className="relative z-10">
            <h2 className="mb-3 font-heading text-3xl font-bold">
              Call for Material Availability and Free Estimates
            </h2>
            <p className="mx-auto mb-7 max-w-lg text-stone-300">
              {BUSINESS_INFO.hours}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <a href={phoneHref}>
                <Button size="lg" className="gap-2 font-semibold shadow-glow">
                  <Phone className="h-5 w-5" />
                  {BUSINESS_INFO.phone}
                </Button>
              </a>
              <a href={`mailto:${BUSINESS_INFO.email}`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-white/25 bg-white/10 font-semibold text-white backdrop-blur hover:bg-white/20 hover:text-white"
                >
                  <Mail className="h-5 w-5" />
                  {BUSINESS_INFO.email}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
