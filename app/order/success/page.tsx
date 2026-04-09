import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BUSINESS_INFO } from "@/data/business";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order has been confirmed. Thank you for choosing Muskingum Materials.",
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = params.order || "N/A";

  return (
    <div className="py-12">
      <div className="container max-w-xl">
        <Card className="shadow-lg border-0">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />

            <h1 className="text-3xl font-bold font-heading mb-2">
              Order Confirmed!
            </h1>

            <p className="text-lg text-muted-foreground mb-4">
              Thank you for your order.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-2xl font-bold font-mono">{orderNumber}</p>
            </div>

            <div className="text-sm text-muted-foreground space-y-2 mb-6">
              <p>
                Your payment has been received. We&apos;ll prepare your order and
                contact you when it&apos;s ready for pickup or delivery.
              </p>
              <p>
                If you have any questions, call us at{" "}
                <a
                  href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}
                  className="text-primary font-medium hover:underline"
                >
                  {BUSINESS_INFO.phone}
                </a>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
                <Button className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call Us
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
