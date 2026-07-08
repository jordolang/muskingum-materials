import { CalculatorHub } from "@/components/calculators/calculator-hub";
import { getProducts } from "@/lib/products";
import type { Product } from "@prisma/client";
import { generateCalculatorsMetadata } from "@/lib/seo/metadata";

export const metadata = generateCalculatorsMetadata();

export default async function CalculatorsPage() {
  let products: Product[] = [];
  try {
    products = await getProducts();
  } catch (error) {
    console.warn("Unable to fetch products for calculators:", error);
  }

  const materials = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    densityLow: p.densityLow ?? 1.4,
    densityHigh: p.densityHigh ?? 1.5,
    priceLow: p.marketPriceLowPerTon ?? p.price ?? 20,
    priceHigh: p.marketPriceHighPerTon ?? p.price ?? 40,
  }));

  return (
    <div className="py-12">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Material Calculators
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pick the tool that fits how you work — trace your project on a
            satellite map, punch in dimensions, convert units, or compare
            depths. Then call (740) 319-0183 for pricing and availability.
          </p>
        </div>

        <CalculatorHub materials={materials} />

        <div className="mt-12 bg-muted/50 rounded-lg p-8 max-w-4xl mx-auto">
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
