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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BUSINESS_INFO, PRODUCTS, SERVICES } from "@/data/business";

const FEATURED_PRODUCTS = PRODUCTS.filter((p) => p.price > 0).slice(0, 6);

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
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 gap-2">
                  <Phone className="h-4 w-4" />
                  Call {BUSINESS_INFO.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-stone-800 text-white py-4">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              <span>Family Owned</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Scale className="h-5 w-5 text-amber-500" />
              <span>State-Approved Scales</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Truck className="h-5 w-5 text-amber-500" />
              <span>Delivery Available</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span>Mon-Fri 7:30-4:00</span>
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
              <Card key={product.name} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <span className="text-lg font-bold text-primary">
                      ${product.price.toFixed(2)}
                      <span className="text-xs text-muted-foreground font-normal">
                        /{product.unit}
                      </span>
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
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
              <Card key={service.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                  <ul className="space-y-1">
                    {service.features.map((feature) => (
                      <li key={feature} className="text-sm flex items-center gap-2">
                        <Star className="h-3 w-3 text-amber-500" />
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
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["equipment", "piles", "stone-hand", "feeder"].map((img) => (
              <div key={img} className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={`/images/photos/${img}.jpg`}
                  alt={img.replace("-", " ")}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
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
