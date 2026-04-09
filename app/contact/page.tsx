import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, Facebook } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "@/components/contact/contact-form";
import { BUSINESS_INFO } from "@/data/business";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Muskingum Materials in Zanesville, OH. Call (740) 319-0183 or email sales@muskingummaterials.com.",
};

export default function ContactPage() {
  return (
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
                <CardTitle className="text-lg">Follow Us</CardTitle>
              </CardHeader>
              <CardContent>
                {BUSINESS_INFO.social.facebook && (
                  <a
                    href={BUSINESS_INFO.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:text-primary transition-colors"
                  >
                    <Facebook className="h-5 w-5 text-primary" />
                    <span className="font-medium">Facebook</span>
                  </a>
                )}
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
  );
}
