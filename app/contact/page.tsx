import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, Facebook, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "@/components/contact/contact-form";
import { BUSINESS_INFO } from "@/data/business";
import { generateLocalBusinessSchema, toJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Muskingum Materials in Zanesville, OH. Call (740) 319-0183 or email sales@muskingummaterials.com.",
};

export default function ContactPage() {
  const localBusinessSchema = generateLocalBusinessSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(localBusinessSchema) }}
      />
      <div className="py-12">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">Contact Us</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Have questions or need a quote? Reach out to us by phone, email, or
            fill out the form below. We&apos;re here to help!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <a
                  href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Phone className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">{BUSINESS_INFO.phone}</p>
                    <p className="text-xs text-muted-foreground">Primary</p>
                  </div>
                </a>
                <a
                  href={`tel:${BUSINESS_INFO.altPhone.replace(/\D/g, "")}`}
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Phone className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">{BUSINESS_INFO.altPhone}</p>
                    <p className="text-xs text-muted-foreground">Alternate</p>
                  </div>
                </a>
                <a
                  href={`mailto:${BUSINESS_INFO.email}`}
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Mail className="h-5 w-5 text-primary shrink-0" />
                  <p className="font-medium">{BUSINESS_INFO.email}</p>
                </a>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{BUSINESS_INFO.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {BUSINESS_INFO.city}, {BUSINESS_INFO.state} {BUSINESS_INFO.zip}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    {Object.entries(BUSINESS_INFO.hoursParsed).map(([day, hours]) => (
                      <div key={day} className="flex justify-between gap-4">
                        <span className="capitalize font-medium">{day}</span>
                        <span className={hours === "Closed" ? "text-muted-foreground" : ""}>
                          {hours}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Find Us Online</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href={BUSINESS_INFO.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-[#1877F2] transition-colors"
                >
                  <Facebook className="h-5 w-5 text-[#1877F2]" />
                  <span className="font-medium">Facebook</span>
                  <ExternalLink className="h-3 w-3 opacity-40 ml-auto" />
                </a>
                <a
                  href={BUSINESS_INFO.social.google}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-[#4285F4] transition-colors"
                >
                  <svg className="h-5 w-5 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="font-medium">Google Business</span>
                  <ExternalLink className="h-3 w-3 opacity-40 ml-auto" />
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>

            {/* Map */}
            <div className="mt-8 rounded-lg overflow-hidden border">
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&q=Muskingum+Materials,1133+Ellis+Dam+Rd,Zanesville+OH+43701`}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Muskingum Materials Location"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
