import type { Metadata } from "next";
import { CoverageChart } from "@/components/calculators/coverage-chart";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Gravel Coverage Chart",
  description:
    "Reference chart showing gravel coverage at different depths and quantities. Plan your project with accurate coverage estimates.",
};

export default async function CoverageChartPage() {
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
      <div className="container max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Gravel Coverage Chart
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how much area different quantities of gravel will cover at
            various depths. Formula: (area ft² × depth inches ÷ 12) ÷ 27 =
            cubic yards.
          </p>
        </div>
        <CoverageChart products={gravelProducts} />

        <div className="mt-12 bg-muted/50 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-4">Common Project Sizes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Walkway</span>
                <span className="font-medium">40-80 sq ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patio</span>
                <span className="font-medium">100-300 sq ft</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Single-car driveway</span>
                <span className="font-medium">300-500 sq ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Two-car driveway</span>
                <span className="font-medium">500-800 sq ft</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
