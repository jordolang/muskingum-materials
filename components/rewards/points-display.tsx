"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, Award } from "lucide-react";
import {
  calculateTierProgress,
  getTierBenefits,
  type Tier,
} from "@/lib/loyalty";

interface PointsDisplayProps {
  points: number;
  tier: Tier;
  annualSpend: number;
}

export function PointsDisplay({
  points,
  tier,
  annualSpend,
}: PointsDisplayProps) {
  const tierBenefits = getTierBenefits(tier);
  const tierProgress = calculateTierProgress(annualSpend, tier);

  // Calculate redemption value (100 points = $5 off)
  const redemptionValue = Math.floor(points / 100) * 5;

  return (
    <div className="space-y-4">
      {/* Points Balance Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Points Balance</CardTitle>
          <Coins className="h-5 w-5 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{points.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">
              {redemptionValue > 0 ? (
                <>
                  Worth <span className="font-semibold">${redemptionValue}</span>{" "}
                  in rewards
                </>
              ) : (
                "Earn points with every purchase"
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tier Status Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Tier Status</CardTitle>
          <Award className="h-5 w-5 text-amber-600" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TierBadge tier={tier} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {tierBenefits.description}
              </p>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {tierProgress.nextTier && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Progress to{" "}
                  <span className="font-semibold capitalize">
                    {tierProgress.nextTier}
                  </span>
                </span>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all"
                  style={{ width: `${tierProgress.progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Spend{" "}
                <span className="font-semibold">
                  ${tierProgress.amountNeeded.toLocaleString()}
                </span>{" "}
                more this year to reach{" "}
                <span className="capitalize">{tierProgress.nextTier}</span> tier
              </p>
            </div>
          )}

          {tier === "gold" && (
            <div className="text-center py-2">
              <p className="text-sm text-amber-600 font-semibold">
                🎉 You&apos;ve reached the highest tier!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Annual Spend</p>
            <p className="text-xl font-bold">
              ${annualSpend.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              Points Per Dollar
            </p>
            <p className="text-xl font-bold">1x</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const config: Record<
    Tier,
    { label: string; className: string }
  > = {
    bronze: {
      label: "Bronze",
      className: "bg-orange-100 text-orange-800 border-orange-200",
    },
    silver: {
      label: "Silver",
      className: "bg-slate-100 text-slate-800 border-slate-200",
    },
    gold: {
      label: "Gold",
      className: "bg-amber-100 text-amber-800 border-amber-200",
    },
  };

  const { label, className } = config[tier];

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
