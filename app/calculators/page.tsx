import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, ArrowRightLeft, BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Gravel Calculators",
  description:
    "Free gravel calculators to estimate how much material you need. Calculate tons, cubic yards, coverage, and costs for your project.",
};

const CALCULATORS = [
  {
    slug: "gravel-calculator",
    title: "Gravel Calculator",
    description:
      "Calculate how much gravel you need based on your project dimensions. Get volume in cubic yards, weight in tons, and estimated cost.",
    icon: Calculator,
  },
  {
    slug: "tons-to-yards",
    title: "Tons to Cubic Yards Converter",
    description:
      "Convert between tons and cubic yards using material-specific density. Select your gravel type for an accurate conversion.",
    icon: ArrowRightLeft,
  },
  {
    slug: "coverage-chart",
    title: "Gravel Coverage Chart",
    description:
      "Reference chart showing how much area different quantities of gravel will cover at various depths.",
    icon: BarChart3,
  },
];

export default function CalculatorsPage() {
  return (
    <div className="py-12">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Gravel Calculators
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Use our free calculators to estimate exactly how much material you
            need for your project. Get accurate tonnage, cubic yardage, and cost
            estimates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {CALCULATORS.map((calc) => (
            <Link key={calc.slug} href={`/calculators/${calc.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <calc.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{calc.title}</CardTitle>
                  <CardDescription>{calc.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
