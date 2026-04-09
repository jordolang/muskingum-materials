import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SERVICES, BUSINESS_INFO } from "@/data/business";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Material sales, delivery, large project pricing, and on-site loading. Muskingum Materials serves Southeast Ohio.",
};

export default function ServicesPage() {
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

        <div className="space-y-12">
          {SERVICES.map((service, i) => (
            <div
              key={service.title}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${
                i % 2 === 1 ? "lg:direction-rtl" : ""
              }`}
            >
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={`/images/photos/${
                      ["equipment", "piles-4", "piles-close-up", "feeding-equipment"][i]
                    }.jpg`}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <h2 className="text-2xl font-bold font-heading mb-3">
                  {service.title}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

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
            <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
              <Button size="lg" className="gap-2">
                <Phone className="h-4 w-4" />
                Call {BUSINESS_INFO.phone}
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
