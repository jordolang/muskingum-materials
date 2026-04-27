import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "seasonal";

interface StockBadgeProps {
  status: StockStatus;
  className?: string;
}

const stockStatusConfig: Record<
  StockStatus,
  { label: string; className: string }
> = {
  in_stock: {
    label: "In Stock",
    className: "border-transparent bg-green-500 text-white hover:bg-green-600",
  },
  low_stock: {
    label: "Limited Supply",
    className: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
  },
  out_of_stock: {
    label: "Out of Stock",
    className: "border-transparent bg-red-500 text-white hover:bg-red-600",
  },
  seasonal: {
    label: "Seasonal",
    className: "border-transparent bg-blue-500 text-white hover:bg-blue-600",
  },
};

export function StockBadge({ status, className }: StockBadgeProps) {
  const config = stockStatusConfig[status];

  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

export type { StockStatus, StockBadgeProps };
