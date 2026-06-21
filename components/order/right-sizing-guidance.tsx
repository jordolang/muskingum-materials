"use client";

import { Lightbulb, ArrowUpCircle, ArrowRightCircle, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getMaterialGuidance,
  getRulesForCategory,
  type MaterialCategory,
} from "@/data/right-sizing-guidance";

interface RightSizingGuidanceProps {
  materialSlug?: string;
  materialCategory?: MaterialCategory;
  className?: string;
}

export function RightSizingGuidance({
  materialSlug,
  materialCategory,
  className,
}: RightSizingGuidanceProps) {
  // Get material-specific guidance if slug is provided
  const guidance = materialSlug ? getMaterialGuidance(materialSlug) : null;

  // Get category-level rules as fallback
  const category = guidance?.category ?? materialCategory;
  const categoryRules = category ? getRulesForCategory(category) : [];

  // If no guidance available, show generic helpful message
  if (!guidance && categoryRules.length === 0) {
    return (
      <Card className={cn("p-4 bg-blue-50 border-blue-200", className)}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <HelpCircle className="h-4 w-4 text-blue-700" />
          </div>
          <div className="flex-1 space-y-2">
            <h6 className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
              Right-Sizing This Order
            </h6>
            <p className="text-xs text-blue-800 leading-relaxed">
              Select a material to see specific ordering guidance. We&apos;ll help you determine
              the right quantity based on your project conditions and account for compaction,
              settling, and waste factors.
            </p>
            <div className="pt-2 border-t border-blue-200">
              <p className="text-[10px] text-blue-700">
                <strong>Need help?</strong> Our team can review your estimate before you order.
                We&apos;ll make sure you have the right amount — not too much, not too little.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Determine recommendation type based on material guidance
  const getRecommendationType = () => {
    if (!guidance) return "match";

    const avgAdjustment = guidance.confidenceRange.typical;
    if (avgAdjustment >= 15) return "over"; // Order significantly over
    if (avgAdjustment >= 8) return "slight-over"; // Order slightly over
    return "match"; // Match expected
  };

  const recommendationType = getRecommendationType();

  const recommendationContent = {
    over: {
      icon: ArrowUpCircle,
      color: "orange",
      title: "Order Toward the High End",
      description: `${guidance?.category === "soil" ? "Topsoil settles" : "This material compacts"} significantly. Most ${guidance?.category} projects need ${guidance?.confidenceRange.typical}% more than the base calculation to account for compaction and settling.`,
    },
    "slight-over": {
      icon: ArrowUpCircle,
      color: "amber",
      title: "Order Slightly Over Expected",
      description: `Account for ${guidance?.confidenceRange.typical}% compaction loss and minor waste. Better to have a small amount left over than run short mid-project.`,
    },
    match: {
      icon: ArrowRightCircle,
      color: "green",
      title: "Match Expected Value",
      description: "This material has minimal compaction. Ordering close to the expected value is usually sufficient, with a small 5-10% cushion for irregular areas.",
    },
  };

  const content = recommendationContent[recommendationType];
  const IconComponent = content.icon;

  // Color scheme based on recommendation type
  const colorClasses = {
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: "text-orange-700",
      text: "text-orange-800",
      textDark: "text-orange-900",
      textLight: "text-orange-700",
      borderDivider: "border-orange-200",
      badge: "bg-orange-100 text-orange-800 border-orange-300",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "text-amber-700",
      text: "text-amber-800",
      textDark: "text-amber-900",
      textLight: "text-amber-700",
      borderDivider: "border-amber-200",
      badge: "bg-amber-100 text-amber-800 border-amber-300",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "text-green-700",
      text: "text-green-800",
      textDark: "text-green-900",
      textLight: "text-green-700",
      borderDivider: "border-green-200",
      badge: "bg-green-100 text-green-800 border-green-300",
    },
  };

  const colors = colorClasses[content.color as keyof typeof colorClasses];

  // Get top tips from guidance (limit to 2-3 most relevant)
  const displayTips = guidance?.tips.slice(0, 2) ?? [];
  const topRule = categoryRules[0]; // Highest priority rule

  return (
    <Card className={cn(`p-4 ${colors.bg} ${colors.border}`, className)}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <IconComponent className={`h-4 w-4 ${colors.icon}`} />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h6 className={`text-xs font-semibold ${colors.textDark} uppercase tracking-wide`}>
                Right-Sizing This Order
              </h6>
              {guidance && (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${colors.badge}`}
                >
                  +{guidance.confidenceRange.typical}% typical
                </Badge>
              )}
            </div>
            <p className={`text-xs ${colors.text} font-medium mb-1`}>
              {content.title}
            </p>
            <p className={`text-xs ${colors.text} leading-relaxed`}>
              {content.description}
            </p>
          </div>

          {/* Material-specific tips */}
          {displayTips.length > 0 && (
            <div className="space-y-1.5">
              {displayTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Lightbulb className={`h-3.5 w-3.5 ${colors.icon} mt-0.5 flex-shrink-0`} />
                  <p className={`text-xs ${colors.text} leading-relaxed`}>
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Top priority rule if available and no specific guidance tips */}
          {!guidance && topRule && (
            <div className="flex items-start gap-2">
              <Lightbulb className={`h-3.5 w-3.5 ${colors.icon} mt-0.5 flex-shrink-0`} />
              <div className={`text-xs ${colors.text}`}>
                <span className="font-medium">{topRule.title}:</span>{" "}
                {topRule.description}
              </div>
            </div>
          )}

          {/* Assurance message */}
          <div className={`pt-2 border-t ${colors.borderDivider}`}>
            <p className={`text-[10px] ${colors.textLight}`}>
              <strong>We&apos;ll help you get it right:</strong>{" "}
              {guidance?.category === "soil" || guidance?.category === "fill"
                ? "Running short on a project? We can deliver additional material the same day in most cases."
                : "Not sure about your measurements? Request a staff review before ordering — we&apos;ll verify your estimate at no charge."}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
