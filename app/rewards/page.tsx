import type { Metadata } from "next";
import Link from "next/link";
import { Award, Gift, TrendingUp, Star, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_INFO } from "@/data/business";
import {
  TIER_THRESHOLDS,
  POINTS_PER_DOLLAR,
  MIN_REDEMPTION_POINTS,
  getTierBenefits
} from "@/lib/loyalty";

export const metadata: Metadata = {
  title: "Rewards Program",
  description:
    "Join the Muskingum Materials Rewards Program. Earn points on every purchase, unlock tier benefits, and redeem for discounts on future orders.",
};

export default function RewardsPage() {
  const bronzeBenefits = getTierBenefits("bronze");
  const silverBenefits = getTierBenefits("silver");
  const goldBenefits = getTierBenefits("gold");

  return (
    <div className="py-12">
      <div className="container">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-heading mb-4">
            Muskingum Materials Rewards Program
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Earn points on every purchase and unlock exclusive benefits.
            Our loyalty program rewards your continued partnership with discounts,
            priority service, and more.
          </p>
          <Link href="/account">
            <Button size="lg" className="gap-2">
              View Your Rewards
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold font-heading text-center mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Earn Points</h3>
              <p className="text-muted-foreground">
                Earn {POINTS_PER_DOLLAR} point for every dollar you spend on materials.
                Points are automatically added to your account with each order.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Unlock Tiers</h3>
              <p className="text-muted-foreground">
                Reach higher tier levels (Silver and Gold) by increasing your annual
                spending to unlock additional benefits and perks.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Redeem Rewards</h3>
              <p className="text-muted-foreground">
                Redeem your points for discounts on future orders.
                Every {MIN_REDEMPTION_POINTS} points equals $5 off your next purchase.
              </p>
            </div>
          </div>
        </div>

        {/* Earning Rules */}
        <div className="bg-muted/50 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold font-heading mb-6">
            Earning Rules
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Earn {POINTS_PER_DOLLAR} point per $1 spent</p>
                <p className="text-sm text-muted-foreground">
                  Points are calculated on your order total before discounts
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Points never expire</p>
                <p className="text-sm text-muted-foreground">
                  Keep your points as long as your account is active
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Automatic point tracking</p>
                <p className="text-sm text-muted-foreground">
                  Points are added to your account immediately after order completion
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Visible in your dashboard</p>
                <p className="text-sm text-muted-foreground">
                  Track your points balance and tier status in your account dashboard
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tier Benefits */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold font-heading text-center mb-8">
            Tier Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bronze Tier */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                <h3 className="text-xl font-semibold">{bronzeBenefits.displayName}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {bronzeBenefits.description}
              </p>
              <p className="text-sm font-medium mb-3">Default tier for all customers</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Earn {POINTS_PER_DOLLAR} point per $1</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Redeem points for discounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Track your rewards online</span>
                </li>
              </ul>
            </div>

            {/* Silver Tier */}
            <div className="border rounded-lg p-6 border-primary/50 relative">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">
                Popular
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <h3 className="text-xl font-semibold">{silverBenefits.displayName}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {silverBenefits.description}
              </p>
              <p className="text-sm font-medium mb-3">
                ${TIER_THRESHOLDS.silver.toLocaleString()}+ annual spending
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>All Bronze benefits</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Priority scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Free delivery on orders $1,000+</span>
                </li>
              </ul>
            </div>

            {/* Gold Tier */}
            <div className="border rounded-lg p-6 border-yellow-600/50 bg-gradient-to-br from-yellow-50/50 to-transparent dark:from-yellow-950/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                <h3 className="text-xl font-semibold">{goldBenefits.displayName}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {goldBenefits.description}
              </p>
              <p className="text-sm font-medium mb-3">
                ${TIER_THRESHOLDS.gold.toLocaleString()}+ annual spending
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>All Silver benefits</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Free delivery on orders $500+</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Exclusive promotional offers</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Redemption Info */}
        <div className="bg-muted/50 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold font-heading mb-6">
            Redeeming Your Points
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Minimum redemption: {MIN_REDEMPTION_POINTS} points</p>
                <p className="text-sm text-muted-foreground">
                  Points must be redeemed in increments of {MIN_REDEMPTION_POINTS}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Redemption value: {MIN_REDEMPTION_POINTS} points = $5 off</p>
                <p className="text-sm text-muted-foreground">
                  Example: 200 points = $10 off, 500 points = $25 off
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Easy redemption at checkout</p>
                <p className="text-sm text-muted-foreground">
                  Apply your points discount when placing orders through your account
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Cannot be combined with other discounts</p>
                <p className="text-sm text-muted-foreground">
                  Points discounts cannot be used with promotional codes or special pricing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-primary/5 rounded-lg p-8">
          <h2 className="text-2xl font-bold font-heading mb-3">
            Ready to Start Earning Rewards?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Create an account or sign in to track your points, view your tier status,
            and redeem rewards on future orders.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Questions? Call us at{" "}
            <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`} className="text-primary hover:underline">
              {BUSINESS_INFO.phone}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
