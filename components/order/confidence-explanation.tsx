"use client";

import { Info, TrendingUp, Ruler } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EstimateResult {
  depthVariance?: number;
  confidenceFactors?: {
    densityVariation: boolean;
    depthMeasurementVariance: boolean;
    materialType?: string;
  };
  source: "map" | "dimensions";
}

interface ConfidenceExplanationProps {
  estimate: EstimateResult;
  className?: string;
}

export function ConfidenceExplanation({
  estimate,
  className,
}: ConfidenceExplanationProps) {
  const hasDensityData = estimate.confidenceFactors?.densityVariation ?? false;
  const hasDepthVariance = estimate.confidenceFactors?.depthMeasurementVariance ?? true;
  const depthVariance = estimate.depthVariance ?? 0.5;
  const materialType = estimate.confidenceFactors?.materialType;

  return (
    <Card className={cn("p-4 bg-amber-50 border-amber-200", className)}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Info className="h-4 w-4 text-amber-700" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h6 className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-2">
              Understanding Your Estimate Range
            </h6>
            <p className="text-xs text-amber-800 leading-relaxed">
              This range reflects real-world conditions that affect how much material
              you&apos;ll need. We provide a range rather than a single number to help
              you plan more accurately.
            </p>
          </div>

          <div className="space-y-2">
            {/* Depth Measurement Variance */}
            {hasDepthVariance && (
              <div className="flex items-start gap-2">
                <Ruler className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <span className="font-medium">Depth variance (±{depthVariance}&quot;):</span>{" "}
                  Field measurements aren&apos;t perfectly precise. Ground irregularities,
                  measurement tools, and compaction can affect the actual depth by about
                  half an inch.
                </div>
              </div>
            )}

            {/* Density Variation */}
            <div className="flex items-start gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                {hasDensityData ? (
                  <>
                    <span className="font-medium">
                      {materialType ? `${materialType} ` : "Material "}density variation:
                    </span>{" "}
                    Different batches of the same material can have slightly different
                    densities depending on moisture content, particle size distribution,
                    and compaction.
                  </>
                ) : (
                  <>
                    <span className="font-medium">Average density estimate:</span>{" "}
                    Since a specific material hasn&apos;t been selected yet, we&apos;re
                    using typical aggregate density (±0.1 tons/yd³) as a conservative
                    estimate. Your actual needs will be more precise once you choose a
                    product.
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200">
            <p className="text-[10px] text-amber-700">
              <strong>Recommendation:</strong> Most projects fall within the expected value.
              {estimate.source === "map"
                ? " Satellite measurements are highly accurate for area, but always verify depth on-site."
                : " Double-check your measurements on-site before ordering."}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
