import type { Metadata } from "next";
import { TonsToYardsConverter } from "@/components/calculators/tons-to-yards-converter";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Tons to Cubic Yards Converter",
  description:
    "Convert between tons and cubic yards of gravel using material-specific density. Select your gravel type for accurate conversions.",
};

export default async function TonsToYardsPage() {
  const products = await getProducts();
  const gravelProducts = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    densityLow: p.densityLow ?? 1.4,
    densityHigh: p.densityHigh ?? 1.5,
  }));

  return (
    <div className="py-12">
      <div className="container max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Tons to Cubic Yards Converter
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Convert between tons and cubic yards using material-specific
            density. Most crushed gravel types weigh between 1.35 and 1.55 tons
            per cubic yard.
          </p>
        </div>
        <TonsToYardsConverter products={gravelProducts} />

        <div className="mt-12 bg-muted/50 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-4">
            Density Reference
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pea gravel</span>
                <span className="font-medium">1.30-1.45 tons/yd³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crushed stone</span>
                <span className="font-medium">1.35-1.55 tons/yd³</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">River rock</span>
                <span className="font-medium">1.30-1.50 tons/yd³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Compacted base (crusher run)</span>
                <span className="font-medium">1.40-1.60 tons/yd³</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
