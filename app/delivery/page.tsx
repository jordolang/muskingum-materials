import type { Metadata } from "next";
import { DeliveryZoneMap } from "@/components/delivery/delivery-zone-map";
import { DeliveryFeeCalculator } from "@/components/delivery/delivery-fee-calculator";

export const metadata: Metadata = {
  title: "Delivery Information",
  description:
    "Check delivery availability and calculate delivery fees for sand, gravel, soil, and stone from Muskingum Materials in Southeast Ohio.",
};

export default function DeliveryPage() {
  return (
    <div className="py-12">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Delivery Information
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Check if we deliver to your location and estimate delivery costs.
            Enter your address below to calculate your delivery fee.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Calculator - Left Side */}
          <div className="lg:col-span-2">
            <div className="sticky top-20">
              <DeliveryFeeCalculator />
            </div>
          </div>

          {/* Map - Right Side */}
          <div className="lg:col-span-3">
            <DeliveryZoneMap />
          </div>
        </div>
      </div>
    </div>
  );
}
