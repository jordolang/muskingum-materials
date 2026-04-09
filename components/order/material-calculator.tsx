"use client";

import { useState, useMemo } from "react";
import { Calculator, Ruler, Truck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PROJECT_PRESETS = [
  { name: "Single Car Driveway", length: 20, width: 10, depth: 4, icon: "🚗" },
  { name: "Double Car Driveway", length: 20, width: 20, depth: 4, icon: "🚙" },
  { name: "Long Driveway", length: 50, width: 12, depth: 4, icon: "🛤️" },
  { name: "Garden Path", length: 20, width: 3, depth: 3, icon: "🌿" },
  { name: "Patio Area", length: 12, width: 12, depth: 4, icon: "🏡" },
  { name: "Small Parking Pad", length: 10, width: 10, depth: 4, icon: "🅿️" },
] as const;

const DEPTH_OPTIONS = [
  { label: '2" – Light Coverage', value: 2 },
  { label: '3" – Walking Paths', value: 3 },
  { label: '4" – Standard (Driveways)', value: 4 },
  { label: '5" – Heavy Traffic', value: 5 },
  { label: '6" – Commercial Grade', value: 6 },
] as const;

interface CalculatorResult {
  cubicFeet: number;
  cubicYards: number;
  tons: number;
  truckloads: number;
}

function calculate(
  lengthFt: number,
  widthFt: number,
  depthIn: number
): CalculatorResult {
  const cubicFeet = lengthFt * widthFt * (depthIn / 12);
  const cubicYards = cubicFeet / 27;
  // Average aggregate weighs ~1.4 tons per cubic yard
  const tons = cubicYards * 1.4;
  // Muskingum trucks carry up to 20 tons
  const truckloads = Math.ceil(tons / 20);
  return { cubicFeet, cubicYards, tons, truckloads };
}

interface MaterialCalculatorProps {
  onApplyEstimate?: (tons: number) => void;
}

export function MaterialCalculator({ onApplyEstimate }: MaterialCalculatorProps) {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState(4);

  const result = useMemo(() => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    if (l > 0 && w > 0 && depth > 0) {
      return calculate(l, w, depth);
    }
    return null;
  }, [length, width, depth]);

  function applyPreset(preset: (typeof PROJECT_PRESETS)[number]) {
    setLength(String(preset.length));
    setWidth(String(preset.width));
    setDepth(preset.depth);
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="bg-stone-800 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-amber-400" />
          Material Calculator
        </CardTitle>
        <p className="text-sm text-stone-300 mt-1">
          Estimate how much material you need for your project
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Quick Presets */}
        <div>
          <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-muted-foreground" />
            Quick Estimate — select a common project:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PROJECT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="text-left p-3 rounded-lg border hover:border-amber-500 hover:bg-amber-50 transition-colors text-sm"
              >
                <span className="text-lg">{preset.icon}</span>
                <p className="font-medium mt-1">{preset.name}</p>
                <p className="text-xs text-muted-foreground">
                  {preset.length}&apos; x {preset.width}&apos; x {preset.depth}&quot;
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Dimensions */}
        <div>
          <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            Or enter your own dimensions:
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Length (feet)
              </label>
              <Input
                type="number"
                placeholder="20"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                min="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Width (feet)
              </label>
              <Input
                type="number"
                placeholder="10"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                min="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Depth (inches)
              </label>
              <select
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {DEPTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
            <h4 className="font-bold text-sm uppercase tracking-wide text-amber-800 mb-4">
              Estimated Material Needed
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-stone-800">
                  {result.tons.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground font-medium">TONS</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-stone-800">
                  {result.cubicYards.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground font-medium">CUBIC YARDS</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-stone-800">
                  {result.cubicFeet.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground font-medium">CUBIC FEET</p>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <Truck className="h-5 w-5 text-amber-600" />
                  <p className="text-2xl font-bold text-stone-800">
                    {result.truckloads}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  TRUCKLOAD{result.truckloads !== 1 ? "S" : ""}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-200">
              <p className="text-xs text-amber-700">
                Based on average aggregate weight of ~1.4 tons/cubic yard.
                Our trucks carry up to 20 tons per load.
                We recommend ordering 5-10% extra for compaction and waste.
              </p>
            </div>

            {onApplyEstimate && (
              <div className="mt-3">
                <Button
                  onClick={() => onApplyEstimate(Math.ceil(result.tons * 1.05))}
                  className="w-full"
                >
                  Use This Estimate ({Math.ceil(result.tons * 1.05)} tons) in My Order
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Size Comparison Reference */}
        <div className="text-xs text-muted-foreground space-y-1.5 bg-muted/50 p-4 rounded-lg">
          <p className="font-semibold text-foreground text-sm mb-2">Size Reference Guide</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <p>🚗 <strong>1 ton</strong> ≈ covers ~80 sq ft at 3&quot; deep</p>
            <p>🛻 <strong>1 truckload (20 tons)</strong> ≈ a single-car driveway</p>
            <p>🏡 <strong>5 tons</strong> ≈ a 10&apos;x12&apos; patio at 4&quot; deep</p>
            <p>🅿️ <strong>10 tons</strong> ≈ a 20&apos;x12&apos; parking pad at 4&quot; deep</p>
            <p>🛤️ <strong>3 tons</strong> ≈ a 30-foot garden path at 3&quot; deep</p>
            <p>🏗️ <strong>40+ tons</strong> ≈ a full commercial parking area</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
