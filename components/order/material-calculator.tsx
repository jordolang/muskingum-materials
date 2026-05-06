"use client";

import { useMemo, useState } from "react";
import { Calculator, Ruler, Truck, Info, Hash, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Tons per truckload — Muskingum trucks haul up to 20 tons.
const TONS_PER_TRUCKLOAD = 20;
// Average aggregate weighs ~1.4 tons per cubic yard.
const TONS_PER_CUBIC_YARD = 1.4;
// 1 cubic yard = 27 cubic feet.
const CUBIC_FEET_PER_YARD = 27;

const QUANTITY_UNITS = [
  { value: "ton", label: "Tons", short: "ton" },
  { value: "truckload", label: "Truckloads (20 tons each)", short: "truckload" },
  { value: "cubic-yard", label: "Cubic Yards", short: "yd³" },
  { value: "cubic-foot", label: "Cubic Feet", short: "ft³" },
] as const;

type QuantityUnit = (typeof QUANTITY_UNITS)[number]["value"];

type DimensionMode = "dimensions" | "total";

interface CalculatorResult {
  cubicFeet: number;
  cubicYards: number;
  tons: number;
  truckloads: number;
}

function calculateFromDimensions(
  lengthFt: number,
  widthFt: number,
  depthIn: number,
): CalculatorResult {
  const cubicFeet = lengthFt * widthFt * (depthIn / 12);
  const cubicYards = cubicFeet / CUBIC_FEET_PER_YARD;
  const tons = cubicYards * TONS_PER_CUBIC_YARD;
  const truckloads = Math.ceil(tons / TONS_PER_TRUCKLOAD);
  return { cubicFeet, cubicYards, tons, truckloads };
}

function calculateFromTotal(
  amount: number,
  unit: QuantityUnit,
): CalculatorResult {
  let tons = 0;
  if (unit === "ton") tons = amount;
  else if (unit === "truckload") tons = amount * TONS_PER_TRUCKLOAD;
  else if (unit === "cubic-yard") tons = amount * TONS_PER_CUBIC_YARD;
  else if (unit === "cubic-foot")
    tons = (amount / CUBIC_FEET_PER_YARD) * TONS_PER_CUBIC_YARD;

  const cubicYards = tons / TONS_PER_CUBIC_YARD;
  const cubicFeet = cubicYards * CUBIC_FEET_PER_YARD;
  const truckloads = Math.ceil(tons / TONS_PER_TRUCKLOAD);
  return { cubicFeet, cubicYards, tons, truckloads };
}

interface MaterialCalculatorProps {
  onApplyEstimate?: (tons: number) => void;
}

export function MaterialCalculator({ onApplyEstimate }: MaterialCalculatorProps) {
  const [mode, setMode] = useState<DimensionMode>("dimensions");

  // Dimension-mode state
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState(4);

  // Total-quantity-mode state
  const [totalAmount, setTotalAmount] = useState("");
  const [totalUnit, setTotalUnit] = useState<QuantityUnit>("ton");

  const result = useMemo<CalculatorResult | null>(() => {
    if (mode === "dimensions") {
      const l = parseFloat(length);
      const w = parseFloat(width);
      if (l > 0 && w > 0 && depth > 0) {
        return calculateFromDimensions(l, w, depth);
      }
      return null;
    }
    const amount = parseFloat(totalAmount);
    if (amount > 0) {
      return calculateFromTotal(amount, totalUnit);
    }
    return null;
  }, [mode, length, width, depth, totalAmount, totalUnit]);

  function applyPreset(preset: (typeof PROJECT_PRESETS)[number]) {
    setMode("dimensions");
    setLength(String(preset.length));
    setWidth(String(preset.width));
    setDepth(preset.depth);
  }

  // Number-pad handlers — total quantity must be entered via the pad, not the keyboard.
  function pressDigit(digit: string) {
    setTotalAmount((current) => {
      if (digit === "." && current.includes(".")) return current;
      if (current === "0" && digit !== ".") return digit;
      const next = current + digit;
      // Cap at 6 chars to keep things sane (e.g. "999.99")
      return next.length > 6 ? current : next;
    });
  }

  function pressBackspace() {
    setTotalAmount((current) => current.slice(0, -1));
  }

  function pressClear() {
    setTotalAmount("");
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
        {/* Mode toggle */}
        <div>
          <p className="text-sm font-medium mb-2">
            How would you like to size your order?{" "}
            <span className="text-red-600 font-semibold">* Required</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === "dimensions" ? "default" : "outline"}
              onClick={() => setMode("dimensions")}
              className="gap-2"
            >
              <Ruler className="h-4 w-4" />
              Enter Dimensions
            </Button>
            <Button
              type="button"
              variant={mode === "total" ? "default" : "outline"}
              onClick={() => setMode("total")}
              className="gap-2"
            >
              <Hash className="h-4 w-4" />
              Total Quantity
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Pick one — either enter your own dimensions or a total quantity.
          </p>
        </div>

        {mode === "dimensions" && (
          <>
            {/* Quick Presets */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-muted-foreground" />
                Quick Estimate — select a common project:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PROJECT_PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    type="button"
                    variant="outline"
                    onClick={() => applyPreset(preset)}
                    className="h-auto text-left p-3 flex flex-col items-start hover:border-amber-500 hover:bg-amber-50"
                  >
                    <span className="text-lg">{preset.icon}</span>
                    <span className="font-medium mt-1 text-sm">{preset.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {preset.length}&apos; x {preset.width}&apos; x {preset.depth}&quot;
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Dimensions */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                Or enter your own dimensions{" "}
                <span className="text-red-600 font-semibold">* Required</span>
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Length (feet) <span className="text-red-600">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    min="0"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Width (feet) <span className="text-red-600">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    min="0"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Depth (inches) <span className="text-red-600">*</span>
                  </label>
                  <Select
                    value={String(depth)}
                    onValueChange={(val) => setDepth(Number(val))}
                  >
                    <SelectTrigger aria-required="true">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPTH_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </>
        )}

        {mode === "total" && (
          <div>
            <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <Hash className="h-4 w-4 text-muted-foreground" />
              Enter a total quantity{" "}
              <span className="text-red-600 font-semibold">* Required</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Unit of measurement <span className="text-red-600">*</span>
                </label>
                <Select
                  value={totalUnit}
                  onValueChange={(val) => setTotalUnit(val as QuantityUnit)}
                >
                  <SelectTrigger aria-required="true">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUANTITY_UNITS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Quantity <span className="text-red-600">*</span>
                </label>
                {/*
                  This input is a read-only display. Quantity is entered through
                  the on-screen number pad below — typing on a hardware keyboard
                  is intentionally disabled.
                */}
                <Input
                  type="text"
                  inputMode="none"
                  readOnly
                  value={totalAmount}
                  placeholder="Use the number pad below"
                  aria-required="true"
                  aria-label="Total quantity (use number pad to enter)"
                  className="text-right font-mono text-lg h-12"
                />
                <NumberPad
                  onDigit={pressDigit}
                  onBackspace={pressBackspace}
                  onClear={pressClear}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Tap the buttons to enter your quantity — keyboard entry is
                  disabled by design.
                </p>
              </div>
            </div>
          </div>
        )}

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
                Based on average aggregate weight of ~1.4 tons/cubic yard. Our
                trucks carry up to 20 tons per load. We recommend ordering 5–10%
                extra for compaction and waste.
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

interface NumberPadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}

function NumberPad({ onDigit, onBackspace, onClear }: NumberPadProps) {
  const keys: Array<{ label: string; onClick: () => void; ariaLabel: string }> = [
    { label: "1", onClick: () => onDigit("1"), ariaLabel: "Number 1" },
    { label: "2", onClick: () => onDigit("2"), ariaLabel: "Number 2" },
    { label: "3", onClick: () => onDigit("3"), ariaLabel: "Number 3" },
    { label: "4", onClick: () => onDigit("4"), ariaLabel: "Number 4" },
    { label: "5", onClick: () => onDigit("5"), ariaLabel: "Number 5" },
    { label: "6", onClick: () => onDigit("6"), ariaLabel: "Number 6" },
    { label: "7", onClick: () => onDigit("7"), ariaLabel: "Number 7" },
    { label: "8", onClick: () => onDigit("8"), ariaLabel: "Number 8" },
    { label: "9", onClick: () => onDigit("9"), ariaLabel: "Number 9" },
    { label: ".", onClick: () => onDigit("."), ariaLabel: "Decimal point" },
    { label: "0", onClick: () => onDigit("0"), ariaLabel: "Number 0" },
  ];

  return (
    <div
      className="grid grid-cols-3 gap-2 mt-3"
      role="group"
      aria-label="Quantity number pad"
    >
      {keys.map((key) => (
        <Button
          key={key.label}
          type="button"
          variant="outline"
          size="lg"
          onClick={key.onClick}
          aria-label={key.ariaLabel}
          className="h-12 text-lg font-semibold"
        >
          {key.label}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onBackspace}
        aria-label="Backspace — delete last digit"
        className="h-12 text-lg"
      >
        <Delete className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClear}
        aria-label="Clear quantity"
        className="col-span-3 text-xs text-muted-foreground hover:text-destructive"
      >
        Clear
      </Button>
    </div>
  );
}
