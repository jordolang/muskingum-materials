import type { Metadata } from "next";
import { OrderForm } from "@/components/order/order-form";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "Order Materials Online",
  description:
    "Order sand, gravel, soil, and stone online from Muskingum Materials. Estimate your project, choose products, and pay securely with Stripe.",
};

export default function OrderPage() {
  return (
    <div className="py-12">
      <div className="container max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Order Materials Online
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We&apos;ll guide you step-by-step: estimate your project, pick your
            materials, choose pickup or delivery, and pay securely.
          </p>
        </div>

        <ErrorBoundary componentName="OrderForm">
          <OrderForm />
        </ErrorBoundary>
      </div>
    </div>
  );
}
