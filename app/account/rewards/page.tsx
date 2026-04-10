import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Award, TrendingUp, ArrowRight, Gift, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getTierBenefits, calculateDiscountForPoints, MIN_REDEMPTION_POINTS } from "@/lib/loyalty";
import type { Tier } from "@/lib/loyalty";

export default async function RewardsPage() {
  const session = await auth();

  let loyaltyAccount: {
    id: string;
    points: number;
    pointsLifetime: number;
    tier: string;
    tierSince: Date;
  } | null = null;

  let transactions: Array<{
    id: string;
    type: string;
    points: number;
    description: string | null;
    createdAt: Date;
  }> = [];

  try {
    loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId: session?.userId ?? "" },
    });

    if (loyaltyAccount) {
      transactions = await prisma.loyaltyTransaction.findMany({
        where: { accountId: loyaltyAccount.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    }
  } catch {
    // DB not ready
  }

  const tier = (loyaltyAccount?.tier || "bronze") as Tier;
  const tierBenefits = getTierBenefits(tier);
  const currentPoints = loyaltyAccount?.points || 0;
  const lifetimePoints = loyaltyAccount?.pointsLifetime || 0;
  const canRedeem = currentPoints >= MIN_REDEMPTION_POINTS;
  const redeemableValue = canRedeem
    ? calculateDiscountForPoints(Math.floor(currentPoints / MIN_REDEMPTION_POINTS) * MIN_REDEMPTION_POINTS)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Rewards Program</h1>
        <p className="text-sm text-muted-foreground">
          Earn points with every purchase and redeem for discounts
        </p>
      </div>

      {/* Points Balance & Tier */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Award className="h-6 w-6 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{currentPoints}</p>
            <p className="text-xs text-muted-foreground">Available Points</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{lifetimePoints}</p>
            <p className="text-xs text-muted-foreground">Lifetime Points</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Sparkles className={`h-6 w-6 mx-auto mb-1 ${getTierColor(tier)}`} />
            <p className="text-2xl font-bold capitalize">{tierBenefits.displayName}</p>
            <p className="text-xs text-muted-foreground">Member Tier</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Benefits */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Your Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Points Earning</p>
                <p className="text-xs text-muted-foreground">
                  Earn 1 point for every $1 spent
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Gift className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Redemption Value</p>
                <p className="text-xs text-muted-foreground">
                  100 points = $5 off your order
                </p>
              </div>
            </div>

            {tierBenefits.freeDeliveryThreshold && (
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Free Delivery</p>
                  <p className="text-xs text-muted-foreground">
                    On orders ${tierBenefits.freeDeliveryThreshold}+
                  </p>
                </div>
              </div>
            )}

            {tierBenefits.priorityScheduling && (
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Priority Scheduling</p>
                  <p className="text-xs text-muted-foreground">
                    Get preferred delivery slots
                  </p>
                </div>
              </div>
            )}
          </div>

          {canRedeem && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    You can redeem up to ${redeemableValue.toFixed(2)} in discounts
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use your points at checkout on your next order
                  </p>
                </div>
                <Link href="/order">
                  <Button size="sm" className="gap-2">
                    <Gift className="h-4 w-4" />
                    Redeem Now
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Points History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No points activity yet</p>
              <Link href="/order">
                <Button>Place Your First Order</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        transaction.points > 0
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      {transaction.points > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <Gift className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm capitalize">
                        {transaction.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.description || "Points transaction"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        transaction.points > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.points > 0 ? "+" : ""}
                      {transaction.points}
                    </p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="text-lg">How Rewards Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-semibold text-sm">Earn Points</p>
                <p className="text-xs text-muted-foreground">
                  Get 1 point for every $1 you spend on orders
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-semibold text-sm">Redeem for Discounts</p>
                <p className="text-xs text-muted-foreground">
                  Use 100 points to get $5 off your next order (min 100 points)
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-semibold text-sm">Unlock Tier Benefits</p>
                <p className="text-xs text-muted-foreground">
                  Reach Silver ($5K annual) or Gold ($15K annual) for exclusive perks
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    bronze: "text-amber-700",
    silver: "text-gray-500",
    gold: "text-yellow-500",
  };
  return colors[tier] || "text-gray-500";
}
