"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3 } from "lucide-react";

interface GravelProduct {
  slug: string;
  name: string;
  densityLow: number;
  densityHigh: number;
  priceLow: number;
  priceHigh: number;
}

interface CoverageChartProps {
  products: GravelProduct[];
}

const DEPTHS = [2, 3, 4, 6];

interface CoverageRow {
  depth: number;
  cubicYards: number;
  tonsLow: number;
  tonsHigh: number;
  costLow: number;
  costHigh: number;
}

export function CoverageChart({ products }: CoverageChartProps) {
  const [area, setArea] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.slug ?? "");
  const [waste, setWaste] = useState("10");
  const [rows, setRows] = useState<CoverageRow[]>([]);

  function calculate() {
    const areaSqFt = parseFloat(area);
    const wastePct = parseFloat(waste) / 100;
    const product = products.find((p) => p.slug === selectedProduct);
    if (!product || isNaN(areaSqFt) || areaSqFt <= 0) return;

    const newRows = DEPTHS.map((depth) => {
      const cubicYards = ((areaSqFt * depth) / 12 / 27) * (1 + wastePct);
      const tonsLow = cubicYards * product.densityLow;
      const tonsHigh = cubicYards * product.densityHigh;
      return {
        depth,
        cubicYards: Math.round(cubicYards * 100) / 100,
        tonsLow: Math.round(tonsLow * 10) / 10,
        tonsHigh: Math.round(tonsHigh * 10) / 10,
        costLow: Math.round(tonsLow * product.priceLow),
        costHigh: Math.round(tonsHigh * product.priceHigh),
      };
    });

    setRows(newRows);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Enter Your Project Area
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Area (sq ft)
              </label>
              <Input
                type="number"
                placeholder="e.g. 500"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Gravel Type
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                {products.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Waste Allowance %
              </label>
              <Input
                type="number"
                value={waste}
                onChange={(e) => setWaste(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={calculate} size="lg" className="w-full sm:w-auto">
            Generate Chart
          </Button>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Coverage for {area} sq ft ({waste}% waste included)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-stone-800 text-white">
                    <th className="px-4 py-3 text-left font-semibold">Depth</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Cubic Yards
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">Tons</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Est. Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.depth}
                      className={`border-b ${i % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                    >
                      <td className="px-4 py-3 font-medium">{row.depth}&quot;</td>
                      <td className="px-4 py-3 text-right">{row.cubicYards}</td>
                      <td className="px-4 py-3 text-right">
                        {row.tonsLow}-{row.tonsHigh}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">
                        ${row.costLow}-${row.costHigh}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Formula: (area ft² x depth inches / 12) / 27 = cubic yards.
              Costs are material-only estimates. Call (740) 319-0183 for exact
              Muskingum Materials pricing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
