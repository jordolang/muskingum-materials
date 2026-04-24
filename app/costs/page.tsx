import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Route, Cuboid, Weight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getCostGuides } from "@/lib/products";

export const metadata: Metadata = {
  title: "Gravel Costs",
  description:
    "Understand gravel costs — delivery pricing, driveway costs, per-yard and per-ton pricing for all material types.",
};

const ICON_MAP: Record<string, typeof Truck> = {
  truck: Truck,
  road: Route,
  cube: Cuboid,
  weight: Weight,
};

export default async function CostsPage() {
  const guides = await getCostGuides();
  type Guide = Awaited<ReturnType<typeof getCostGuides>>[number];

  return (
    <div className="py-12">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Gravel Costs
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Gravel costs vary by material type, quantity, delivery distance, and
            location. Use the guides below to understand typical pricing and plan
            your project budget.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {guides.map((guide: Guide) => {
            const Icon = ICON_MAP[guide.icon ?? "cube"] ?? Cuboid;
            return (
              <Link key={guide.slug} href={`/costs/${guide.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{guide.title}</CardTitle>
                    {guide.subtitle && (
                      <CardDescription>{guide.subtitle}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {guide.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
