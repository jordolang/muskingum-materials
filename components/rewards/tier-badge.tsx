import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const tierBadgeVariants = cva(
  "inline-flex items-center gap-1.5",
  {
    variants: {
      tier: {
        bronze: "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100/80 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
        silver: "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-100/80 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800",
        gold: "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100/80 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
      },
    },
    defaultVariants: {
      tier: "bronze",
    },
  }
);

const tierIconVariants = cva(
  "h-3.5 w-3.5",
  {
    variants: {
      tier: {
        bronze: "text-amber-600 dark:text-amber-500",
        silver: "text-slate-600 dark:text-slate-500",
        gold: "text-yellow-600 dark:text-yellow-500",
      },
    },
    defaultVariants: {
      tier: "bronze",
    },
  }
);

export interface TierBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tierBadgeVariants> {
  showIcon?: boolean;
}

function TierBadge({ className, tier, showIcon = true, ...props }: TierBadgeProps) {
  const tierLabel = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : "Bronze";

  return (
    <Badge
      variant="outline"
      className={cn(tierBadgeVariants({ tier }), className)}
      {...props}
    >
      {showIcon && <Award className={tierIconVariants({ tier })} />}
      {tierLabel}
    </Badge>
  );
}

export { TierBadge, tierBadgeVariants };
