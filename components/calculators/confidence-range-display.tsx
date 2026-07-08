"use client";

import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EstimateResult {
  tons: number;
  tonsLow?: number;
  tonsExpected?: number;
  tonsHigh?: number;
  cubicYards: number;
  cubicYardsLow?: number;
  cubicYardsExpected?: number;
  cubicYardsHigh?: number;
  depthVariance?: number;
  confidenceFactors?: {
    densityVariation: boolean;
    depthMeasurementVariance: boolean;
    materialType?: string;
  };
}

interface ConfidenceRangeDisplayProps {
  estimate: EstimateResult;
  className?: string;
}

export function ConfidenceRangeDisplay({
  estimate,
  className,
}: ConfidenceRangeDisplayProps) {
  const hasConfidenceRange =
    estimate.tonsLow !== undefined &&
    estimate.tonsExpected !== undefined &&
    estimate.tonsHigh !== undefined;

  // Calculate position of expected value within range for visual indicator
  const getExpectedPosition = (
    low: number,
    expected: number,
    high: number
  ): number => {
    const range = high - low;
    if (range === 0) return 50; // Centered if no range
    return ((expected - low) / range) * 100;
  };

  if (!hasConfidenceRange) {
    // Fallback to single value display when confidence range is not available
    return (
      <div className={cn("space-y-3", className)}>
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums text-amber-700">
            {estimate.tons.toFixed(1)} tons
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {estimate.cubicYards.toFixed(1)} cubic yards
          </p>
        </div>
        <p className="text-[10px] text-center text-muted-foreground">
          Using average density
        </p>
      </div>
    );
  }

  const tonsPosition = getExpectedPosition(
    estimate.tonsLow!,
    estimate.tonsExpected!,
    estimate.tonsHigh!
  );

  const cubicYardsPosition = getExpectedPosition(
    estimate.cubicYardsLow!,
    estimate.cubicYardsExpected!,
    estimate.cubicYardsHigh!
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tons Range */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-stone-700">
            Tonnage Range
          </h5>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Confidence range information"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Range accounts for{" "}
                  {estimate.confidenceFactors?.densityVariation
                    ? "material density variation"
                    : "average density"}{" "}
                  and depth measurement variance (±{estimate.depthVariance ?? 0.5}
                  &quot;). Most projects fall within the expected value.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Range Values */}
        <div className="flex items-center justify-between text-xs tabular-nums">
          <span className="text-stone-600 font-medium">
            {estimate.tonsLow!.toFixed(1)}
          </span>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            Expected: {estimate.tonsExpected!.toFixed(1)} tons
          </Badge>
          <span className="text-stone-600 font-medium">
            {estimate.tonsHigh!.toFixed(1)}
          </span>
        </div>

        {/* Visual Range Indicator */}
        <div className="relative h-2 bg-stone-200 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200" />
          <div
            className="absolute top-0 h-full w-1 bg-amber-700 shadow-sm"
            style={{ left: `${tonsPosition}%` }}
            aria-label={`Expected value at ${estimate.tonsExpected!.toFixed(1)} tons`}
          />
        </div>
      </div>

      {/* Cubic Yards Range */}
      <div className="space-y-2 pt-2 border-t border-stone-200">
        <div className="flex items-center justify-between text-xs tabular-nums">
          <span className="text-stone-600">
            {estimate.cubicYardsLow!.toFixed(1)} yd³
          </span>
          <span className="text-amber-700 font-semibold">
            {estimate.cubicYardsExpected!.toFixed(1)} yd³
          </span>
          <span className="text-stone-600">
            {estimate.cubicYardsHigh!.toFixed(1)} yd³
          </span>
        </div>

        {/* Visual Range Indicator */}
        <div className="relative h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-stone-300 via-stone-400 to-stone-300" />
          <div
            className="absolute top-0 h-full w-0.5 bg-stone-700"
            style={{ left: `${cubicYardsPosition}%` }}
            aria-label={`Expected value at ${estimate.cubicYardsExpected!.toFixed(1)} cubic yards`}
          />
        </div>
      </div>

      {/* Confidence Factor Indicator */}
      {estimate.confidenceFactors && (
        <div className="pt-2">
          <p className="text-[10px] text-center text-stone-600">
            {estimate.confidenceFactors.densityVariation ? (
              <>
                Range based on{" "}
                {estimate.confidenceFactors.materialType
                  ? `${estimate.confidenceFactors.materialType} `
                  : ""}
                density variation + depth measurement variance
              </>
            ) : (
              <>Range based on average density + depth measurement variance</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
