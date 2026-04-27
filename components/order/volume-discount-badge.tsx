"use client";

import { TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VolumeDiscountBadgeProps {
  /**
   * The pricing tier that was applied (e.g., "10+ tons", "50+ tons", "100+ tons")
   */
  tierName?: string;
  /**
   * Total savings amount in dollars
   */
  savingsAmount?: number;
  /**
   * Discount percentage (0-100)
   */
  discountPercent?: number;
  /**
   * Visual variant of the badge
   */
  variant?: "default" | "secondary" | "outline";
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function VolumeDiscountBadge({
  tierName,
  savingsAmount,
  discountPercent,
  variant = "default",
  className,
}: VolumeDiscountBadgeProps) {
  // Don't render if no discount information is provided
  if (!tierName && !savingsAmount && !discountPercent) {
    return null;
  }

  // Format the badge text
  let badgeText = "Volume Discount Applied";

  if (tierName) {
    badgeText = `${tierName} Volume Discount`;
  } else if (discountPercent) {
    badgeText = `${discountPercent}% Volume Discount`;
  }

  return (
    <Badge
      variant={variant}
      className={cn(
        "gap-1 bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
        className
      )}
    >
      <TrendingDown className="h-3 w-3" />
      <span>{badgeText}</span>
      {savingsAmount && savingsAmount > 0 && (
        <span className="font-bold">
          (Save ${savingsAmount.toFixed(2)})
        </span>
      )}
    </Badge>
  );
}
