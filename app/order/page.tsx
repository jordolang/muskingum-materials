import type { Metadata } from "next";
import { OrderForm } from "@/components/order/order-form";
import { MaterialCalculator } from "@/components/order/material-calculator";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "Order Materials Online",
  description:
    "Order sand, gravel, soil, and stone online from Muskingum Materials. Calculate your needs, choose products, and pay securely with Stripe.",
};

export default function OrderPage() {
  return (
    <div className="py-12">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Order Materials Online
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select your products, calculate how much you need, and pay securely
            online. Pick up at our yard or request delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Calculator - Left Side */}
          <div className="lg:col-span-2">
            <div className="sticky top-20">
              <ErrorBoundary componentName="MaterialCalculator">
                <MaterialCalculator />
              </ErrorBoundary>
            </div>
          </div>

          {/* Order Form - Right Side */}
          <div className="lg:col-span-3">
            <ErrorBoundary componentName="OrderForm">
              <OrderForm />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
