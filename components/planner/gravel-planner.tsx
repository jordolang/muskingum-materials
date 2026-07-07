"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone } from "lucide-react";
import { BUSINESS_INFO } from "@/data/business";
import { PlannerMap } from "./planner-map";
import { calculateConfidenceRange, type DensityRange } from "@/lib/estimate-calculations";
import { ConfidenceRangeDisplay } from "@/components/order/confidence-range-display";

interface Material {
  slug: string;
  name: string;
  densityLow: number;
  densityHigh: number;
  priceLow: number;
  priceHigh: number;
}

interface GravelPlannerProps {
  materials: Material[];
}

interface Estimate {
  areaSqFt: number;
  cubicYards: number;
  cubicYardsLow: number;
  cubicYardsExpected: number;
  cubicYardsHigh: number;
  tons: number;
  tonsLow: number;
  tonsExpected: number;
  tonsHigh: number;
  costLow: number;
  costExpected: number;
  costHigh: number;
  depthVariance?: number;
  confidenceFactors?: {
    densityVariation: boolean;
    depthMeasurementVariance: boolean;
    materialType?: string;
  };
}

const DEPTH_PRESETS = [2, 3, 4, 6];
const COMPACTION_MAP: Record<string, number> = {
  "bank-run": 15,
  "fill-dirt": 10,
  "fill-sand-washed": 8,
  "asphalt-millings": 20,
  "topsoil-unprocessed": 10,
  "9-gravel-washed": 5,
  "8-gravel-washed": 5,
  "57-gravel-washed": 5,
  "304-crushed-gravel": 12,
  "4-crushed-gravel": 12,
  "oversized-gravel-washed": 5,
  "304-limestone": 12,
  "57-limestone": 5,
};

export function GravelPlanner({ materials }: GravelPlannerProps) {

  const [totalArea, setTotalArea] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState(
    materials.find((m) => m.slug === "57-gravel-washed")?.slug ??
      materials[0]?.slug ??
      "",
  );
  const [depth, setDepth] = useState(3);
  const [waste, setWaste] = useState(10);
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  const recalculate = useCallback(
    (areaSqFt: number, matSlug?: string, depthIn?: number, wastePct?: number) => {
      const mat = materials.find(
        (m) => m.slug === (matSlug ?? selectedMaterial),
      );
      if (!mat || areaSqFt <= 0) {
        setEstimate(null);
        return;
      }

      const d = depthIn ?? depth;
      const w = wastePct ?? waste;
      const compaction = COMPACTION_MAP[mat.slug] ?? 5;

      // Build density range for confidence calculations
      const densityRange: DensityRange = {
        low: mat.densityLow,
        avg: (mat.densityLow + mat.densityHigh) / 2,
        high: mat.densityHigh,
      };

      // Calculate base estimate with confidence range
      const baseEstimate = calculateConfidenceRange(
        areaSqFt,
        d,
        densityRange,
        mat.name,
        "map"
      );

      // Apply waste and compaction factors to all confidence levels
      const wasteFactor = 1 + w / 100;
      const compactionFactor = 1 + compaction / 100;
      const adjustmentFactor = wasteFactor * compactionFactor;

      const cubicYardsLow = (baseEstimate.cubicYardsLow ?? 0) * adjustmentFactor;
      const cubicYardsExpected = baseEstimate.cubicYardsExpected! * adjustmentFactor;
      const cubicYardsHigh = (baseEstimate.cubicYardsHigh ?? 0) * adjustmentFactor;

      const tonsLow = (baseEstimate.tonsLow ?? 0) * adjustmentFactor;
      const tonsExpected = baseEstimate.tonsExpected! * adjustmentFactor;
      const tonsHigh = (baseEstimate.tonsHigh ?? 0) * adjustmentFactor;

      // Calculate costs using average price for expected, and range for low/high
      const avgPrice = (mat.priceLow + mat.priceHigh) / 2;
      const costLow = tonsLow * mat.priceLow;
      const costExpected = tonsExpected * avgPrice;
      const costHigh = tonsHigh * mat.priceHigh;

      setEstimate({
        areaSqFt: Math.round(areaSqFt),
        cubicYards: Math.round(cubicYardsExpected * 100) / 100,
        cubicYardsLow: Math.round(cubicYardsLow * 100) / 100,
        cubicYardsExpected: Math.round(cubicYardsExpected * 100) / 100,
        cubicYardsHigh: Math.round(cubicYardsHigh * 100) / 100,
        tons: Math.round(tonsExpected * 10) / 10,
        tonsLow: Math.round(tonsLow * 10) / 10,
        tonsExpected: Math.round(tonsExpected * 10) / 10,
        tonsHigh: Math.round(tonsHigh * 10) / 10,
        costLow: Math.round(costLow),
        costExpected: Math.round(costExpected),
        costHigh: Math.round(costHigh),
        depthVariance: baseEstimate.depthVariance,
        confidenceFactors: baseEstimate.confidenceFactors,
      });
    },
    [materials, selectedMaterial, depth, waste],
  );

  function handleAreaChange(areaSqFt: number) {
    setTotalArea(areaSqFt);
    recalculate(areaSqFt);
  }

  function handleMaterialChange(slug: string) {
    setSelectedMaterial(slug);
    recalculate(totalArea, slug);
  }

  function handleDepthChange(d: number) {
    setDepth(d);
    recalculate(totalArea, undefined, d);
  }

  function handleWasteChange(w: number) {
    setWaste(w);
    recalculate(totalArea, undefined, undefined, w);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Sidebar */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        {/* Material Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Gravel Type
              </label>
              <Select value={selectedMaterial} onValueChange={handleMaterialChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m) => (
                    <SelectItem key={m.slug} value={m.slug}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Depth
              </label>
              <div className="flex gap-1.5">
                {DEPTH_PRESETS.map((d) => (
                  <Button
                    key={d}
                    variant={depth === d ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDepthChange(d)}
                  >
                    {d}&quot;
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Waste Allowance (%)
              </label>
              <Input
                type="number"
                min={0}
                max={50}
                step={5}
                value={waste}
                onChange={(e) => handleWasteChange(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                10% recommended for uneven ground and settling
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className={estimate ? "border-primary/30 bg-primary/5" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Estimate</CardTitle>
          </CardHeader>
          <CardContent>
            {estimate ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    Total Area
                  </span>
                  <span className="font-semibold">
                    {estimate.areaSqFt.toLocaleString()} ft²
                  </span>
                </div>

                <ConfidenceRangeDisplay estimate={estimate} />

                <div className="flex justify-between items-center py-2 border-t pt-3">
                  <span className="text-sm text-muted-foreground">
                    Est. Material Cost
                  </span>
                  <div className="text-right">
                    <div className="font-bold text-lg text-primary">
                      ${estimate.costExpected.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      (${estimate.costLow.toLocaleString()}-$
                      {estimate.costHigh.toLocaleString()})
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Includes {waste}% waste allowance and compaction factor.
                  Delivery not included.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Draw your project area on the map to see your estimate.
              </p>
            )}
          </CardContent>
        </Card>

        {/* CTA */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Ready to order?</p>
            <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
              <Button className="w-full gap-2" size="sm">
                <Phone className="h-4 w-4" />
                Call {BUSINESS_INFO.phone}
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <div className="flex-1 min-h-[500px] lg:min-h-[600px]">
        <PlannerMap onAreaChange={handleAreaChange} />
      </div>
    </div>
  );
}
