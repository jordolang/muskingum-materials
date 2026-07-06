import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  ArrowRight,
  Shield,
  Scale,
  Truck,
  Clock,
  MapPin,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BUSINESS_INFO,
  PRODUCTS,
  PRODUCT_IMAGES,
  SERVICES,
} from "@/data/business";
import { ReviewsCarousel } from "@/components/home/reviews-carousel";
import { HomepageFAQ } from "@/components/home/homepage-faq";
import { HomeProductCard } from "@/components/home/home-product-card";
import { ServicesBento } from "@/components/home/services-bento";
import { HeroSwitch } from "@/components/home/hero-switch";
import { StaticHero } from "@/components/home/cinematic-hero/static-hero";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sanityClient } from "@/lib/sanity/client";
import { testimonialsQuery } from "@/lib/sanity/queries";
import { generateLocalBusinessSchema, toJsonLd } from "@/lib/seo/structured-data";
import { generateHomeMetadata } from "@/lib/seo/metadata";

// Generate SEO metadata with canonical URL, OG images, and Twitter cards
export const metadata = generateHomeMetadata();

// ISR — rebuild the homepage at most once per minute and let on-demand
// revalidation refresh it when database content changes.
export const revalidate = 60;

interface HomeProduct {
  _id: string;
  name: string;
  description: string;
  pricePerTon: number | null;
  unit: string;
  imageUrl?: string;
  imageAlt?: string;
  slug?: string;
}

interface HomeService {
  _id: string;
  title: string;
  description: string;
  icon?: string;
  features: string[];
}

interface HomeTestimonial {
  _id: string;
  name: string;
  company?: string;
  rating: number;
  text: string;
}

// Turn a product/service name into a URL/key-safe slug.
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Static fallbacks from the canonical lists in data/business.ts so the homepage
// still renders its product and service sections if the database is unreachable
// (missing DATABASE_URL in a preview deploy, transient Neon outage, etc.) rather
// than crashing the whole page. Synthetic IDs are prefixed with "static-" to
// keep them clearly distinct from real database primary keys.
function getFallbackHomeProducts(): HomeProduct[] {
  return PRODUCTS.map((product) => {
    const slug = slugify(product.name);
    return {
      _id: `static-${slug}`,
      name: product.name,
      slug,
      description: product.description,
      pricePerTon: product.price ?? null,
      unit: product.unit,
      imageUrl: PRODUCT_IMAGES[product.name],
      imageAlt: product.name,
    };
  });
}

function getFallbackHomeServices(): HomeService[] {
  return SERVICES.map((service) => ({
    _id: `static-${slugify(service.title)}`,
    title: service.title,
    description: service.description,
    icon: service.icon,
    features: [...service.features],
  }));
}

async function getHomeProducts(): Promise<HomeProduct[]> {
  try {
    const productRows = await prisma.product.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        price: true,
        unit: true,
        imageUrl: true,
        imageAlt: true,
      },
    });

    const mapped: HomeProduct[] = productRows.map((row) => ({
      _id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.shortDescription ?? row.description,
      pricePerTon: row.price,
      unit: row.unit,
      imageUrl: row.imageUrl ?? undefined,
      imageAlt: row.imageAlt ?? undefined,
    }));

    return mapped.length > 0 ? mapped : getFallbackHomeProducts();
  } catch (error) {
    logger.error(
      "Homepage: failed to load products from database, using static fallback",
      error,
    );
    return getFallbackHomeProducts();
  }
}

async function getHomeServices(): Promise<HomeService[]> {
  try {
    const serviceRows = await prisma.service.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        icon: true,
        features: true,
      },
    });

    const mapped: HomeService[] = serviceRows.map((row) => ({
      _id: row.id,
      title: row.title,
      description: row.description,
      icon: row.icon ?? undefined,
      features: row.features,
    }));

    return mapped.length > 0 ? mapped : getFallbackHomeServices();
  } catch (error) {
    logger.error(
      "Homepage: failed to load services from database, using static fallback",
      error,
    );
    return getFallbackHomeServices();
  }
}

export default async function HomePage() {
  // Pull products and services from Postgres (Prisma), each with a static
  // fallback so a database hiccup never takes down the homepage. Testimonials
  // come from Sanity and degrade to a static fallback inside the
  // ReviewsCarousel server component when empty.
  const [featuredProducts, services, testimonials] = await Promise.all([
    getHomeProducts(),
    getHomeServices(),
    sanityClient
      .fetch<HomeTestimonial[]>(
        testimonialsQuery,
        {},
        { next: { tags: ["testimonials"] } }
      )
      // Sanity can *resolve* to null/undefined when unconfigured (e.g. a
      // preview env without project creds) rather than reject, which would
      // slip past .catch and leave testimonials undefined — coalesce to [].
      .then((result) => result ?? [])
      .catch((error) => {
        console.error("Failed to fetch testimonials from Sanity:", error);
        return [] as HomeTestimonial[];
      }),
  ]);

  const localBusinessSchema = generateLocalBusinessSchema();


  return (
    <>
      {/* Structured Data - LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(localBusinessSchema) }}
      />

      {/* Hero — mobile/touch gets a fast static hero (the LCP-critical path);
          desktop pointers swap in the cinematic 3-act scroll experience (also
          served standalone at /experience). See HeroSwitch. */}
      <HeroSwitch staticHero={<StaticHero />} />

      {/* Trust Badges — glass pill below the cinematic hero */}
      <section className="relative z-20 px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="glass-dark mx-auto grid max-w-5xl grid-cols-2 gap-2 rounded-3xl bg-stone-900/85 p-3 text-white shadow-float md:grid-cols-4">
          {[
            { icon: Shield, label: "Family Owned" },
            { icon: Scale, label: "State-Approved Scales" },
            { icon: Truck, label: "Delivery Available" },
            { icon: Clock, label: "Mon–Fri 7:30–4:00" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center justify-center gap-2.5 rounded-2xl px-3 py-2.5 text-center transition-colors hover:bg-white/5"
            >
              <Icon className="h-5 w-5 shrink-0 text-amber-400" />
              <span className="text-sm font-bold uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gradient-to-b from-stone-100 to-stone-50 py-16 sm:py-20">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-heading mb-3">
              Our Products
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We carry a wide selection of sand, gravel, soil, and stone products
              for residential and commercial projects.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <HomeProductCard
                key={product._id}
                id={product._id}
                name={product.name}
                slug={product.slug}
                description={product.description}
                pricePerTon={product.pricePerTon}
                unit={product.unit}
                imageUrl={product.imageUrl}
                imageAlt={product.imageAlt}
              />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/products">
              <Button variant="outline" className="gap-2">
                View All Products & Pricing
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Bento */}
      <ServicesBento services={services} />

      {/* Gallery Preview */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-heading mb-3">
              See Our Operation
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Take a closer look at our facility, equipment, and the quality materials we produce.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { img: "equipment", label: "Heavy Equipment", desc: "State of the art machinery" },
              { img: "piles", label: "Material Stockpiles", desc: "Variety of aggregates" },
              { img: "stone-hand", label: "Product Quality", desc: "Hand-inspected gravel" },
              { img: "feeder", label: "Processing", desc: "Sorting & washing systems" },
            ].map((item) => (
              <Link key={item.img} href="/gallery" className="group hover-lift relative block aspect-square cursor-pointer overflow-hidden rounded-3xl shadow-float">
                <Image
                  src={`/images/photos/${item.img}.jpg`}
                  alt={item.label}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Permanent gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
                {/* Label - always visible */}
                <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-all duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <Camera className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-white font-bold text-sm tracking-wide">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-white/70 text-xs translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    {item.desc}
                  </p>
                </div>
                {/* Hover border glow */}
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent transition-colors duration-300 group-hover:border-amber-400/50" />
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/gallery">
              <Button variant="outline" className="gap-2">
                View Full Gallery
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 bg-stone-900 relative overflow-hidden">
        {/* Ambient background texture */}
        <div className="absolute inset-0 opacity-5">
          <Image
            src="/images/photos/piles-close-up.jpg"
            alt=""
            fill
            className="object-cover"
            aria-hidden
          />
        </div>
        <div className="container relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-heading text-white mb-3">
              What Our Customers Say
            </h2>
            <p className="text-stone-400 max-w-2xl mx-auto">
              Don&apos;t just take our word for it — hear from homeowners and
              contractors across Southeast Ohio.
            </p>
          </div>
          <ReviewsCarousel testimonials={testimonials} />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-heading mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Quick answers to the most common questions about our products, pricing, and services.
            </p>
          </div>
          <HomepageFAQ />
        </div>
      </section>

      {/* CTA — floating glow panel */}
      <section className="px-3 py-16 sm:px-5 sm:py-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-stone-900 px-6 py-16 text-center text-white shadow-float">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 0%, rgba(245,158,11,0.28), transparent 70%)",
            }}
          />
          <div className="relative z-10">
            <h2 className="mb-4 font-heading text-3xl font-bold sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mb-7 max-w-lg text-stone-300">
              Call today to set up your order or get a quote for your project.
              We&apos;re here to help Monday through Friday.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
                <Button size="lg" className="gap-2 font-semibold shadow-glow">
                  <Phone className="h-5 w-5" />
                  Call {BUSINESS_INFO.phone}
                </Button>
              </a>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-white/25 bg-white/10 font-semibold text-white backdrop-blur hover:bg-white/20 hover:text-white"
                >
                  <MapPin className="h-5 w-5" />
                  Get Directions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
