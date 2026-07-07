import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Shield,
  Scale,
  Truck,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_INFO } from "@/data/business";
import { generateLocalBusinessSchema, toJsonLd } from "@/lib/seo/structured-data";
import { generateHomeMetadata } from "@/lib/seo/metadata";

// Generate SEO metadata with canonical URL, OG images, and Twitter cards
export const metadata = generateHomeMetadata();

// The simplified homepage is fully static — no database or CMS content.
const PRODUCT_LIST = [
  { name: "Sand", note: "Washed fill sand" },
  { name: "Gravel", note: "Washed and crushed, multiple sizes" },
  { name: "State Approved Aggregate", note: "ODOT approved" },
  { name: "Oversized Aggregate", note: "Heavy drainage and erosion control" },
  { name: "Crushed Concrete", note: "Base material and road fill" },
];

const TRUST_BADGES = [
  { icon: Shield, label: "ODOT Approved Materials" },
  { icon: Scale, label: "State-Approved Scales" },
  { icon: Truck, label: "Up to 20 Tons Per Load" },
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

      {/* Hero — large aerial photo of the yard */}
      <section className="ambient-glow px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="relative mx-auto flex min-h-[600px] max-w-7xl items-center overflow-hidden rounded-[2rem] shadow-float">
          <Image
            src="/images/photos/aerial.jpg"
            alt="Aerial view of the Muskingum Materials yard in Zanesville, Ohio"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 hero-gradient" />
          <div className="relative z-10 w-full px-7 py-20 text-center sm:px-12">
            <div className="mx-auto max-w-3xl text-white">
              <h1 className="mb-4 font-heading text-5xl font-bold leading-tight md:text-7xl">
                Muskingum Materials
              </h1>
              <p className="mb-8 text-xl text-white/90 md:text-2xl">
                State Approved Sand, Gravel &amp; Aggregate Supplier
              </p>
              <div className="mb-9 space-y-2 text-lg">
                <a
                  href={phoneHref}
                  className="flex items-center justify-center gap-3 font-semibold hover:text-amber-400 transition-colors"
                >
                  <Phone className="h-5 w-5 text-amber-400" />
                  {BUSINESS_INFO.phone}
                </a>
                <a
                  href={`mailto:${BUSINESS_INFO.email}`}
                  className="flex items-center justify-center gap-3 hover:text-amber-400 transition-colors"
                >
                  <Mail className="h-5 w-5 text-amber-400" />
                  {BUSINESS_INFO.email}
                </a>
                <div className="flex items-center justify-center gap-3">
                  <MapPin className="h-5 w-5 text-amber-400" />
                  {BUSINESS_INFO.address}, {BUSINESS_INFO.city},{" "}
                  {BUSINESS_INFO.state} {BUSINESS_INFO.zip}
                </div>
              </div>
              <a href={phoneHref}>
                <Button
                  size="lg"
                  className="gap-2 bg-amber-600 font-semibold text-white shadow-glow hover:bg-amber-700"
                >
                  <Phone className="h-5 w-5" />
                  Call for Material Availability &amp; Free Estimates
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="relative z-20 -mt-7 px-3 sm:px-5">
        <div className="glass-dark mx-auto grid max-w-5xl grid-cols-2 gap-2 rounded-3xl bg-stone-900/85 p-3 text-white shadow-float md:grid-cols-4">
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

      {/* Products — simple list, no pricing */}
      <section className="py-16 sm:py-20">
        <div className="container max-w-3xl">
          <h2 className="mb-8 text-center font-heading text-3xl font-bold">
            Materials
          </h2>
          <ul className="divide-y rounded-2xl border bg-background shadow-sm">
            {PRODUCT_LIST.map((product) => (
              <li
                key={product.name}
                className="flex items-baseline justify-between gap-4 px-6 py-4"
              >
                <span className="font-semibold">{product.name}</span>
                <span className="text-sm text-muted-foreground">
                  {product.note}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col items-center gap-3">
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
            View ODOT certified supplier listing
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
