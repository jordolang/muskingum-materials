"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, MapPin } from "lucide-react";
import { BUSINESS_INFO } from "@/data/business";
import { PlannerMap } from "./planner-map";

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
  tonsLow: number;
  tonsHigh: number;
  costLow: number;
  costHigh: number;
}

const DEPTH_PRESETS = [2, 3, 4, 6];
const COMPACTION_MAP: Record<string, number> = {
  "crusher-run": 15,
  "recycled-asphalt": 20,
  "crushed-stone": 10,
  "crushed-limestone": 10,
  "411-gravel": 10,
  "decomposed-granite": 8,
  "fill-dirt": 10,
  "construction-gravel": 10,
};

export function GravelPlanner({ materials }: GravelPlannerProps) {
  const [apiLoaded, setApiLoaded] = useState(false);
  const [totalArea, setTotalArea] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState(
    materials.find((m) => m.slug === "crushed-stone")?.slug ??
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

      const depthFt = d / 12;
      let cubicYards = (areaSqFt * depthFt) / 27;
      cubicYards *= 1 + w / 100;
      cubicYards *= 1 + compaction / 100;

      const tonsLow = cubicYards * mat.densityLow;
      const tonsHigh = cubicYards * mat.densityHigh;
      const costLow = tonsLow * mat.priceLow;
      const costHigh = tonsHigh * mat.priceHigh;

      setEstimate({
        areaSqFt: Math.round(areaSqFt),
        cubicYards: Math.round(cubicYards * 100) / 100,
        tonsLow: Math.round(tonsLow * 10) / 10,
        tonsHigh: Math.round(tonsHigh * 10) / 10,
        costLow: Math.round(costLow),
        costHigh: Math.round(costHigh),
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
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedMaterial}
                onChange={(e) => handleMaterialChange(e.target.value)}
              >
                {materials.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name}
                  </option>
                ))}
              </select>
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
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    Total Area
                  </span>
                  <span className="font-semibold">
                    {estimate.areaSqFt.toLocaleString()} ft²
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    Volume Needed
                  </span>
                  <span className="font-semibold">
                    {estimate.cubicYards} yd³
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    Weight to Order
                  </span>
                  <span className="font-semibold text-primary">
                    {estimate.tonsLow}-{estimate.tonsHigh} tons
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">
                    Est. Material Cost
                  </span>
                  <span className="font-bold text-lg text-primary">
                    ${estimate.costLow.toLocaleString()}-$
                    {estimate.costHigh.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
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
