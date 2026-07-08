"use client";

import { useState } from "react";
import {
  Calculator,
  ArrowRightLeft,
  BarChart3,
  Satellite,
  type LucideIcon,
} from "lucide-react";
import { GravelCalculator } from "./gravel-calculator";
import { TonsToYardsConverter } from "./tons-to-yards-converter";
import { CoverageChart } from "./coverage-chart";
import { MapEstimator } from "./map-estimator";

/**
 * One materials array feeds every calculator. The dimension-based tools only
 * need name + density; the map estimator also uses the market price range to
 * show an estimated cost.
 */
export interface CalculatorMaterial {
  slug: string;
  name: string;
  densityLow: number;
  densityHigh: number;
  priceLow: number;
  priceHigh: number;
}

interface CalculatorHubProps {
  materials: CalculatorMaterial[];
}

type CalculatorKey = "map" | "gravel" | "converter" | "coverage";

interface CalculatorOption {
  key: CalculatorKey;
  title: string;
  icon: LucideIcon;
  /** Real-world question this calculator answers. */
  scenario: string;
  /** Concrete examples of when to pick it. */
  example: string;
}

const CALCULATOR_OPTIONS: CalculatorOption[] = [
  {
    key: "map",
    title: "Map Area Estimator",
    icon: Satellite,
    scenario: "Not sure of your measurements? Trace the job on a satellite map.",
    example:
      "Example: outline your driveway, parking pad, or pond bank right on the map — no tape measure needed.",
  },
  {
    key: "gravel",
    title: "Gravel Calculator",
    icon: Calculator,
    scenario: "Know your dimensions? Enter length, width, and depth.",
    example:
      "Example: a 50 ft × 12 ft driveway topped with 4 inches of #57 gravel.",
  },
  {
    key: "converter",
    title: "Tons ↔ Yards Converter",
    icon: ArrowRightLeft,
    scenario: "Have a quote in tons but think in cubic yards — or the reverse?",
    example:
      "Example: your landscaper said 8 yards of limestone; see what that weighs.",
  },
  {
    key: "coverage",
    title: "Coverage Chart",
    icon: BarChart3,
    scenario: "Comparing depths? See what one area needs at 2\", 3\", 4\", and 6\".",
    example:
      "Example: decide between a 3-inch top-up or a full 6-inch base for 800 sq ft.",
  },
];

export function CalculatorHub({ materials }: CalculatorHubProps) {
  const [active, setActive] = useState<CalculatorKey>("map");

  return (
    <div className="space-y-8">
      {/* Calculator selector */}
      <div
        role="tablist"
        aria-label="Choose a calculator"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {CALCULATOR_OPTIONS.map((option) => {
          const selected = active === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(option.key)}
              className={`h-full rounded-2xl border p-4 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/40 shadow-md"
                  : "border-stone-200 bg-background hover:border-primary/40 hover:shadow-sm"
              }`}
            >
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${
                  selected ? "bg-primary/15" : "bg-primary/10"
                }`}
              >
                <option.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="mb-1 font-semibold leading-snug">
                {option.title}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {option.scenario}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active calculator */}
      <div>
        <p className="mb-5 text-sm text-muted-foreground">
          {CALCULATOR_OPTIONS.find((o) => o.key === active)?.example}
        </p>
        {active === "map" && <MapEstimator materials={materials} />}
        {active === "gravel" && <GravelCalculator products={materials} />}
        {active === "converter" && <TonsToYardsConverter products={materials} />}
        {active === "coverage" && <CoverageChart products={materials} />}
      </div>
    </div>
  );
}
