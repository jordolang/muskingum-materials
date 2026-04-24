import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BUSINESS_INFO } from "@/data/business";
import { getServices } from "@/lib/products";

export const revalidate = 7200; // Revalidate every 2 hours (ISR)

export const metadata: Metadata = {
  title: "Services",
  description:
    "Material sales, delivery, large project pricing, and on-site loading. Muskingum Materials serves Southeast Ohio.",
};

// Rotate through on-site photos when services don't have their own image
const SERVICE_FALLBACK_IMAGES = [
  "/images/photos/equipment.jpg",
  "/images/photos/piles-4.jpg",
  "/images/photos/piles-close-up.jpg",
  "/images/photos/feeding-equipment.jpg",
] as const;

export default async function ServicesPage() {
  const services = await getServices();
  type Service = Awaited<ReturnType<typeof getServices>>[number];
  const phone = BUSINESS_INFO.phone;

  return (
    <div className="py-12">
      <div className="container">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-heading mb-3">Our Services</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From material sales to delivery, we provide everything you need for
            your construction and landscaping projects.
          </p>
        </div>

        {services.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Services are currently unavailable. Please call {phone} for
            assistance.
          </p>
        ) : (
          <div className="space-y-12">
            {services.map((service: Service, i: number) => {
              const imageSrc =
                SERVICE_FALLBACK_IMAGES[i % SERVICE_FALLBACK_IMAGES.length];
              const isReversed = i % 2 === 1;

              return (
                <div
                  key={service.id}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
                >
                  <div className={isReversed ? "lg:order-2" : ""}>
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <Image
                        src={imageSrc}
                        alt={service.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                  <div className={isReversed ? "lg:order-1" : ""}>
                    <h2 className="text-2xl font-bold font-heading mb-3">
                      {service.title}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      {service.description}
                    </p>
                    <ul className="space-y-2">
                      {service.features.map((feature: string) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Why Choose Us */}
        <div className="mt-16 bg-muted/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold font-heading text-center mb-8">
            Why Choose Muskingum Materials?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BUSINESS_INFO.features.map((feature) => (
              <Card key={feature}>
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold mb-4">
            Need Materials for Your Project?
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`tel:${phone.replace(/\D/g, "")}`}>
              <Button size="lg" className="gap-2">
                <Phone className="h-4 w-4" />
                Call {phone}
              </Button>
            </a>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="gap-2">
                Request a Quote
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
