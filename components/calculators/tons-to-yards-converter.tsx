"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRightLeft } from "lucide-react";

interface GravelProduct {
  slug: string;
  name: string;
  densityLow: number;
  densityHigh: number;
}

interface TonsToYardsConverterProps {
  products: GravelProduct[];
}

type ConvertDirection = "tons-to-yards" | "yards-to-tons";

interface ConversionResult {
  inputValue: number;
  inputUnit: string;
  outputLow: number;
  outputHigh: number;
  outputUnit: string;
  density: string;
}

export function TonsToYardsConverter({ products }: TonsToYardsConverterProps) {
  const [direction, setDirection] = useState<ConvertDirection>("tons-to-yards");
  const [inputValue, setInputValue] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.slug ?? "");
  const [result, setResult] = useState<ConversionResult | null>(null);

  function convert() {
    const value = parseFloat(inputValue);
    const product = products.find((p) => p.slug === selectedProduct);
    if (!product || isNaN(value) || value <= 0) return;

    const avgDensity = (product.densityLow + product.densityHigh) / 2;

    if (direction === "tons-to-yards") {
      const yardsLow = value / product.densityHigh;
      const yardsHigh = value / product.densityLow;
      setResult({
        inputValue: value,
        inputUnit: "tons",
        outputLow: Math.round(yardsLow * 100) / 100,
        outputHigh: Math.round(yardsHigh * 100) / 100,
        outputUnit: "cubic yards",
        density: `${product.densityLow}-${product.densityHigh} tons/yd³`,
      });
    } else {
      const tonsLow = value * product.densityLow;
      const tonsHigh = value * product.densityHigh;
      setResult({
        inputValue: value,
        inputUnit: "cubic yards",
        outputLow: Math.round(tonsLow * 10) / 10,
        outputHigh: Math.round(tonsHigh * 10) / 10,
        outputUnit: "tons",
        density: `${product.densityLow}-${product.densityHigh} tons/yd³`,
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Convert
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Direction */}
          <div className="flex gap-2">
            <Button
              variant={direction === "tons-to-yards" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setDirection("tons-to-yards");
                setResult(null);
              }}
            >
              Tons → Cubic Yards
            </Button>
            <Button
              variant={direction === "yards-to-tons" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setDirection("yards-to-tons");
                setResult(null);
              }}
            >
              Cubic Yards → Tons
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                {direction === "tons-to-yards" ? "Tons" : "Cubic Yards"}
              </label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Material Type
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
          </div>

          <Button onClick={convert} size="lg" className="w-full sm:w-auto">
            Convert
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Conversion Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-lg text-muted-foreground mb-2">
                {result.inputValue} {result.inputUnit} =
              </div>
              <div className="text-4xl font-bold text-primary">
                {result.outputLow}-{result.outputHigh}
              </div>
              <div className="text-lg text-muted-foreground mt-1">
                {result.outputUnit}
              </div>
              <div className="text-xs text-muted-foreground mt-4">
                Based on density of {result.density}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
