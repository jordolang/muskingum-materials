import type { Metadata } from "next";
import { GravelCalculator } from "@/components/calculators/gravel-calculator";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Gravel Calculator",
  description:
    "Calculate how much gravel you need. Enter dimensions to get cubic yards, tons, and estimated cost for your project.",
};

export default async function GravelCalculatorPage() {
  const products = await getProducts();
  const gravelProducts = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    densityLow: p.densityLow ?? 1.4,
    densityHigh: p.densityHigh ?? 1.5,
    priceLow: p.marketPriceLowPerTon ?? p.price ?? 20,
    priceHigh: p.marketPriceHighPerTon ?? p.price ?? 40,
  }));

  return (
    <div className="py-12">
      <div className="container max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Gravel Calculator
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enter your project dimensions to calculate how much gravel you need
            in cubic yards, tons, and estimated cost.
          </p>
        </div>
        <GravelCalculator products={gravelProducts} />

        <div className="mt-12 bg-muted/50 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-4">
            Recommended Depths by Project
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Driveways</span>
                <span className="font-medium">4-6 inches</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patios</span>
                <span className="font-medium">3-4 inches</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Walkways</span>
                <span className="font-medium">2-3 inches</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Drainage</span>
                <span className="font-medium">6-12 inches</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
