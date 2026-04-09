"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";

interface GravelProduct {
  slug: string;
  name: string;
  densityLow: number;
  densityHigh: number;
  priceLow: number;
  priceHigh: number;
}

interface GravelCalculatorProps {
  products: GravelProduct[];
}

interface CalculationResult {
  cubicYards: number;
  tonsLow: number;
  tonsHigh: number;
  costLow: number;
  costHigh: number;
}

const SHAPES = ["rectangle", "circle", "triangle"] as const;
type Shape = (typeof SHAPES)[number];

const DEPTH_PRESETS = [2, 3, 4, 6];

export function GravelCalculator({ products }: GravelCalculatorProps) {
  const [shape, setShape] = useState<Shape>("rectangle");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [radius, setRadius] = useState("");
  const [base, setBase] = useState("");
  const [height, setHeight] = useState("");
  const [depth, setDepth] = useState("4");
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.slug ?? "");
  const [overage, setOverage] = useState("10");
  const [result, setResult] = useState<CalculationResult | null>(null);

  function calculate() {
    const depthInches = parseFloat(depth);
    const overagePct = parseFloat(overage) / 100;
    const product = products.find((p) => p.slug === selectedProduct);
    if (!product || isNaN(depthInches)) return;

    let areaSqFt = 0;
    if (shape === "rectangle") {
      areaSqFt = parseFloat(length) * parseFloat(width);
    } else if (shape === "circle") {
      const r = parseFloat(radius);
      areaSqFt = Math.PI * r * r;
    } else if (shape === "triangle") {
      areaSqFt = (parseFloat(base) * parseFloat(height)) / 2;
    }

    if (isNaN(areaSqFt) || areaSqFt <= 0) return;

    const depthFeet = depthInches / 12;
    const cubicFeet = areaSqFt * depthFeet;
    const cubicYards = cubicFeet / 27;
    const cubicYardsWithOverage = cubicYards * (1 + overagePct);

    const tonsLow = cubicYardsWithOverage * product.densityLow;
    const tonsHigh = cubicYardsWithOverage * product.densityHigh;
    const costLow = tonsLow * product.priceLow;
    const costHigh = tonsHigh * product.priceHigh;

    setResult({
      cubicYards: Math.round(cubicYardsWithOverage * 100) / 100,
      tonsLow: Math.round(tonsLow * 10) / 10,
      tonsHigh: Math.round(tonsHigh * 10) / 10,
      costLow: Math.round(costLow),
      costHigh: Math.round(costHigh),
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Project Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Shape Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Shape</label>
            <div className="flex gap-2">
              {SHAPES.map((s) => (
                <Button
                  key={s}
                  variant={shape === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShape(s);
                    setResult(null);
                  }}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          {/* Dimension Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shape === "rectangle" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Length (feet)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 50"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Width (feet)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 12"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                  />
                </div>
              </>
            )}
            {shape === "circle" && (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Radius (feet)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 10"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                />
              </div>
            )}
            {shape === "triangle" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Base (feet)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 20"
                    value={base}
                    onChange={(e) => setBase(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Height (feet)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 15"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Depth */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Depth (inches)
            </label>
            <div className="flex gap-2 mb-2">
              {DEPTH_PRESETS.map((d) => (
                <Button
                  key={d}
                  variant={depth === String(d) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDepth(String(d))}
                >
                  {d}&quot;
                </Button>
              ))}
            </div>
            <Input
              type="number"
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              className="max-w-[120px]"
            />
          </div>

          {/* Gravel Type */}
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

          {/* Overage */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Overage % (for uneven ground, spillage, settling)
            </label>
            <Input
              type="number"
              value={overage}
              onChange={(e) => setOverage(e.target.value)}
              className="max-w-[120px]"
            />
          </div>

          <Button onClick={calculate} size="lg" className="w-full sm:w-auto">
            Calculate
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Estimated Material Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {result.cubicYards}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Cubic Yards
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {result.tonsLow}-{result.tonsHigh}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Tons</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  ${result.costLow}-${result.costHigh}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Estimated Cost (material only)
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Includes {overage}% overage. Actual costs vary by location and
              supplier. Call Muskingum Materials at (740) 319-0183 for exact
              pricing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
