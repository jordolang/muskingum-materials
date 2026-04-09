import type { Metadata } from "next";
import { GravelPlanner } from "@/components/planner/gravel-planner";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Gravel Planner",
  description:
    "Draw your project on a satellite map to get exact tonnage and cost estimates. Trace your driveway, patio, or walkway and instantly see how much material you need.",
};

export default async function PlannerPage() {
  const products = await getProducts();
  const materials = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    densityLow: p.densityLow ?? 1.4,
    densityHigh: p.densityHigh ?? 1.5,
    priceLow: p.marketPriceLowPerTon ?? p.price ?? 20,
    priceHigh: p.marketPriceHighPerTon ?? p.price ?? 40,
  }));

  return (
    <div className="py-8">
      <div className="container">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold font-heading mb-2">
            Gravel Planner
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enter your address, trace your project area on the satellite map,
            and instantly see how many tons to order and what it will cost.
          </p>
        </div>
        <GravelPlanner materials={materials} />
      </div>
    </div>
  );
}
