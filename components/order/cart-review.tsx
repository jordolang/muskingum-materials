"use client";

import { ClipboardList, Minus, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CartItem {
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

interface CartReviewProps {
  cart: CartItem[];
  totals: {
    subtotal: number;
    volumeDiscount: number;
    tax: number;
    processingFee: number;
    total: number;
    totalTons: number;
  };
  onRemove: (name: string) => void;
  onUpdateQuantity: (name: string, delta: number) => void;
}

export function CartReview({
  cart,
  totals,
  onRemove,
  onUpdateQuantity,
}: CartReviewProps) {
  return (
    <div className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ClipboardList className="h-4 w-4 text-amber-600" />
          Order Summary
        </div>
        {cart.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Hover any line to remove · use ± to adjust
          </p>
        )}
      </div>

      {cart.length === 0 ? (
        <Card className="bg-muted/30 border-dashed p-4 text-center text-sm text-muted-foreground">
          Your cart is empty.
        </Card>
      ) : (
        <div className="space-y-1">
          {cart.map((item) => (
            <div
              key={item.name}
              className="group relative flex items-center gap-3 rounded-md py-2 px-2 -mx-2 text-sm transition-colors hover:bg-muted/50"
            >
              {/* Item name + per-unit price */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  ${item.price.toFixed(2)} per {item.unit}
                </p>
              </div>

              {/* Quantity stepper */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.name, -1)}
                  className="h-11 w-11 inline-flex items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 shrink-0"
                  aria-label={`Decrease ${item.name}`}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <Badge
                  variant="secondary"
                  className="min-w-[3.5rem] justify-center font-mono"
                >
                  {item.quantity} {item.unit}
                  {item.quantity !== 1 ? "s" : ""}
                </Badge>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.name, 1)}
                  className="h-11 w-11 inline-flex items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shrink-0"
                  aria-label={`Increase ${item.name}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Line total */}
              <span className="font-semibold tabular-nums w-20 text-right shrink-0">
                ${(item.price * item.quantity).toFixed(2)}
              </span>

              {/* Hover-reveal on desktop, always visible on touch devices */}
              <button
                type="button"
                onClick={() => onRemove(item.name)}
                className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-destructive/50 md:opacity-0 md:group-hover:opacity-100"
                aria-label={`Remove ${item.name} from order`}
                title={`Remove ${item.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <Separator className="my-3" />

          <div className="space-y-1.5 text-sm">
            <Row label={`Subtotal (${totals.totalTons} tons)`} value={totals.subtotal} />
            {totals.volumeDiscount > 0 && (
              <Row
                label="Volume Discount"
                value={-totals.volumeDiscount}
                accent="positive"
              />
            )}
            <Row label="Tax (7.25%)" value={totals.tax} />
            <Row label="Card Processing (4.5%)" value={totals.processingFee} />
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-amber-700 tabular-nums">
                ${totals.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "positive";
}) {
  const isPositive = accent === "positive";
  return (
    <div className="flex justify-between">
      <span
        className={isPositive ? "text-green-600 font-medium" : "text-muted-foreground"}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${
          isPositive ? "text-green-600 font-medium" : ""
        }`}
      >
        {value < 0 ? `-$${Math.abs(value).toFixed(2)}` : `$${value.toFixed(2)}`}
      </span>
    </div>
  );
}
