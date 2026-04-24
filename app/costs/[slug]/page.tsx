import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCostGuideBySlug, getCostGuides } from "@/lib/products";
import { BUSINESS_INFO } from "@/data/business";

interface CostGuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) return [];
  const guides = await getCostGuides();
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: CostGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getCostGuideBySlug(slug);
  if (!guide) return {};
  return {
    title: guide.metaTitle ?? guide.title,
    description: guide.metaDescription ?? guide.description,
  };
}

export default async function CostGuidePage({ params }: CostGuidePageProps) {
  const { slug } = await params;
  const guide = await getCostGuideBySlug(slug);
  if (!guide) notFound();

  const content = guide.content as Record<string, unknown>;

  return (
    <div className="py-12">
      <div className="container max-w-4xl">
        <Link
          href="/costs"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Costs
        </Link>

        <h1 className="text-4xl font-bold font-heading mb-3">{guide.title}</h1>
        <p className="text-lg text-muted-foreground mb-8">
          {guide.description}
        </p>

        {/* Delivery Cost */}
        {slug === "delivery-cost" && <DeliveryCostContent content={content} />}

        {/* Driveway Cost */}
        {slug === "driveway-cost" && <DrivewayCostContent content={content} />}

        {/* Cost Per Yard */}
        {slug === "cost-per-yard" && <PricingTableContent content={content} unit="yard" />}

        {/* Cost Per Ton */}
        {slug === "cost-per-ton" && <PricingTableContent content={content} unit="ton" />}

        {/* CTA */}
        <div className="mt-12 bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">
            Get Exact Pricing for Your Project
          </h2>
          <p className="text-muted-foreground mb-4">
            Muskingum Materials offers competitive pricing on all materials with
            delivery throughout Southeast Ohio.
          </p>
          <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
            <Button size="lg" className="gap-2">
              <Phone className="h-4 w-4" />
              Call {BUSINESS_INFO.phone}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

function DeliveryCostContent({ content }: { content: Record<string, unknown> }) {
  const sections = (content.sections ?? []) as Array<{
    title: string;
    items: Array<Record<string, string>>;
  }>;
  const tips = (content.tips ?? []) as string[];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">
              {String(content.priceRange ?? "")}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Added to order
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">
              {String(content.perTonRange ?? "")}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Per ton delivered
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">
              {String(content.perYardRange ?? "")}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Per yard delivered
            </div>
          </CardContent>
        </Card>
      </div>

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {section.items.map((item, i) => {
                const entries = Object.entries(item);
                const label = entries[0]?.[1] ?? "";
                const value = entries[1]?.[1] ?? "";
                return (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2 border-b last:border-0"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {tips.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-lg">Delivery Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-amber-600 shrink-0">&#x2022;</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DrivewayCostContent({ content }: { content: Record<string, unknown> }) {
  const layers = (content.layers ?? []) as Array<{
    name: string;
    material: string;
    cost: string;
    purpose: string;
  }>;
  const costComponents = (content.costComponents ?? []) as Array<{
    component: string;
    percentage?: string;
    range?: string;
  }>;
  const alternatives = (content.alternatives ?? []) as Array<{
    name: string;
    cost: string;
    note: string;
  }>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">
              {String(content.totalRange ?? "")}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Standard single-car driveway (12x50 ft)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">
              {String(content.perSqFtRange ?? "")}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Per square foot installed
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Three-Layer Driveway System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {layers.map((layer, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b last:border-0"
              >
                <div className="flex-1">
                  <div className="font-medium">{layer.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {layer.material} — {layer.purpose}
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {layer.cost}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cost Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {costComponents.map((comp, i) => (
              <div
                key={i}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <span className="text-muted-foreground">{comp.component}</span>
                <span className="font-medium">
                  {comp.percentage ?? comp.range ?? ""}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Gravel vs. Alternatives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alternatives.map((alt, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b last:border-0"
              >
                <div className="flex-1">
                  <div className="font-medium">{alt.name}</div>
                  <div className="text-sm text-muted-foreground">{alt.note}</div>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {alt.cost}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PricingTableContent({
  content,
  unit,
}: {
  content: Record<string, unknown>;
  unit: "yard" | "ton";
}) {
  const pricingTable = (content.pricingTable ?? []) as Array<{
    material: string;
    low: number;
    high: number;
  }>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">
              {String(content.generalRange ?? "")}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              General range
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              {String(content.coverageNote ?? "")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Complete Pricing by Material (per {unit})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-stone-800 text-white">
                  <th className="px-4 py-3 text-left font-semibold">
                    Material
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Low</th>
                  <th className="px-4 py-3 text-right font-semibold">High</th>
                </tr>
              </thead>
              <tbody>
                {pricingTable.map((row, i) => (
                  <tr
                    key={row.material}
                    className={`border-b ${i % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                  >
                    <td className="px-4 py-3 font-medium">{row.material}</td>
                    <td className="px-4 py-3 text-right text-primary font-semibold">
                      ${row.low}
                    </td>
                    <td className="px-4 py-3 text-right text-primary font-semibold">
                      ${row.high}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
