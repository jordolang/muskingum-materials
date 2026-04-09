import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Phone, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_INFO } from "@/data/business";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Muskingum Materials is a family-owned sand, soil, and gravel company in Zanesville, OH serving Southeast Ohio.",
};

export default function AboutPage() {
  return (
    <div className="py-12">
      <div className="container">
        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h1 className="text-4xl font-bold font-heading mb-4">
              About Muskingum Materials
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              {BUSINESS_INFO.tagline}
            </p>
            <p className="text-muted-foreground mb-6">
              Muskingum Materials is a family-owned and operated business located
              in Zanesville, Ohio. We take pride in providing Southeast Ohio with
              high-quality sand, soil, and gravel products at fair, competitive
              prices.
            </p>
            <p className="text-muted-foreground mb-6">
              Whether you&apos;re a homeowner working on a landscaping project or a
              contractor managing a large construction site, we have the materials
              and expertise to get the job done right. Our state-approved scales
              ensure accurate measurements, and our modern equipment means fast,
              efficient service.
            </p>
            <div className="flex gap-3">
              <Link href="/contact">
                <Button className="gap-2">
                  Contact Us
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
                <Button variant="outline" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call Now
                </Button>
              </a>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
            <Image
              src="/images/photos/aerial.jpg"
              alt="Muskingum Materials facility"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Values */}
        <div className="bg-muted/50 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold font-heading text-center mb-8">
            Why Customers Choose Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BUSINESS_INFO.features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{feature}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold font-heading mb-4">
              Visit Our Location
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{BUSINESS_INFO.address}</p>
                  <p>{BUSINESS_INFO.city}, {BUSINESS_INFO.state} {BUSINESS_INFO.zip}</p>
                </div>
              </div>
              <p>
                <strong className="text-foreground">Hours:</strong>{" "}
                {BUSINESS_INFO.hours}
              </p>
              <p>
                <strong className="text-foreground">Phone:</strong>{" "}
                {BUSINESS_INFO.phone}
              </p>
              <p>
                <strong className="text-foreground">Email:</strong>{" "}
                <a href={`mailto:${BUSINESS_INFO.email}`} className="text-primary hover:underline">
                  {BUSINESS_INFO.email}
                </a>
              </p>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Accepted Payment Methods:</p>
              <p>{BUSINESS_INFO.paymentMethods.join(", ")}</p>
            </div>
          </div>
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image
              src="/images/photos/clearing.jpg"
              alt="Muskingum Materials entrance"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
