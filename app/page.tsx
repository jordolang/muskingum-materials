import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  ArrowRight,
  Truck,
  Scale,
  Clock,
  Shield,
  Star,
  MapPin,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BUSINESS_INFO, PRODUCTS, SERVICES } from "@/data/business";
import { ReviewsCarousel } from "@/components/home/reviews-carousel";
import { HomepageFAQ } from "@/components/home/homepage-faq";

const FEATURED_PRODUCTS = PRODUCTS.filter((p) => p.price > 0).slice(0, 6);

const PRODUCT_IMAGES: Record<string, string> = {
  "Bank Run": "/images/products/bank-run.jpg",
  "Fill Dirt": "/images/products/fill-dirt.jpg",
  "Fill Sand": "/images/products/fill-sand.jpg",
  "Topsoil (Unprocessed)": "/images/products/topsoil.jpg",
  "#8 Fractured Gravel (Washed)": "/images/products/fractured-gravel.jpg",
  "#9 Gravel (Washed)": "/images/products/fine-gravel.jpg",
  "#8 Gravel (Washed)": "/images/photos/stone-close-up.jpg",
  "#57 Gravel (Washed)": "/images/photos/piles-close-up.jpg",
  "304 Crushed Gravel": "/images/photos/piles-7.jpg",
  "Oversized Gravel (Washed)": "/images/photos/stone-hand.jpg",
};

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[600px] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/photos/aerial.jpg"
            alt="Muskingum Materials aerial view"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 hero-gradient" />
        </div>

        <div className="container relative z-10 py-20">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-4 leading-tight">
              Sand, Soil &<br />Gravel Delivered
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-6 max-w-lg">
              {BUSINESS_INFO.tagline}. Family-owned, fair pricing, and serving
              Southeast Ohio since day one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/products">
                <Button size="lg" className="bg-white text-amber-800 hover:bg-white/90 font-semibold gap-2">
                  View Products & Pricing
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
                <Button size="lg" className="bg-amber-600 text-white hover:bg-amber-700 font-semibold gap-2">
                  <Phone className="h-4 w-4" />
                  Call {BUSINESS_INFO.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-stone-800 text-white py-5">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex items-center justify-center gap-2.5">
              <Shield className="h-5 w-5 text-amber-400 shrink-0" />
              <span className="font-bold text-sm tracking-wide uppercase">Family Owned</span>
            </div>
            <div className="flex items-center justify-center gap-2.5">
              <Scale className="h-5 w-5 text-amber-400 shrink-0" />
              <span className="font-bold text-sm tracking-wide uppercase">State-Approved Scales</span>
            </div>
            <div className="flex items-center justify-center gap-2.5">
              <Truck className="h-5 w-5 text-amber-400 shrink-0" />
              <span className="font-bold text-sm tracking-wide uppercase">Delivery Available</span>
            </div>
            <div className="flex items-center justify-center gap-2.5">
              <Clock className="h-5 w-5 text-amber-400 shrink-0" />
              <span className="font-bold text-sm tracking-wide uppercase">Mon–Fri 7:30–4:00</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-background">
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
            {FEATURED_PRODUCTS.map((product) => (
              <Card key={product.name} className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-card">
                <div className="relative h-48 w-full">
                  <Image
                    src={PRODUCT_IMAGES[product.name] || "/images/photos/piles.jpg"}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-amber-600 text-white px-3 py-1.5 rounded-lg shadow-md">
                    <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                    <span className="text-xs opacity-90">/{product.unit}</span>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-lg mb-1.5">{product.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                </CardContent>
              </Card>
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

      {/* Services */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-heading mb-3">
              What We Offer
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              More than just materials - we provide complete solutions for your project needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SERVICES.map((service) => (
              <Card key={service.title} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      {service.icon === "mountain" && <Scale className="h-5 w-5 text-amber-700" />}
                      {service.icon === "truck" && <Truck className="h-5 w-5 text-amber-700" />}
                      {service.icon === "calculator" && <Star className="h-5 w-5 text-amber-700" />}
                      {service.icon === "loader" && <Clock className="h-5 w-5 text-amber-700" />}
                    </div>
                    <h3 className="text-xl font-bold">{service.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="text-sm flex items-center gap-2.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

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
              <div key={item.img} className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer">
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
                <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-amber-400/50 transition-colors duration-300" />
              </div>
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
          <ReviewsCarousel />
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

      {/* CTA */}
      <section className="py-16 bg-stone-800 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold font-heading mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-stone-300 mb-6 max-w-lg mx-auto">
            Call today to set up your order or get a quote for your project.
            We&apos;re here to help Monday through Friday.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
              <Button size="lg" className="gap-2 font-semibold">
                <Phone className="h-5 w-5" />
                Call {BUSINESS_INFO.phone}
              </Button>
            </a>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 gap-2">
                <MapPin className="h-5 w-5" />
                Get Directions
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
