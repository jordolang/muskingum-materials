"use client";

import { Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CartItem {
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

interface Totals {
  subtotal: number;
  volumeDiscount: number;
  tax: number;
  processingFee: number;
  total: number;
  totalTons: number;
}

interface CartSummaryProps {
  cart: CartItem[];
  totals: Totals;
  onRemoveItem: (name: string) => void;
  onCheckout: () => void;
}

export function CartSummary({
  cart,
  totals,
  onRemoveItem,
  onCheckout,
}: CartSummaryProps) {
  if (cart.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-0 border-t-4 border-t-amber-500">
      <CardHeader>
        <CardTitle className="text-lg">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cart.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRemoveItem(item.name)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <span className="font-medium">{item.name}</span>
              <Badge variant="secondary" className="text-xs">
                {item.quantity} {item.unit}{item.quantity !== 1 ? "s" : ""}
              </Badge>
            </div>
            <span className="font-semibold">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}

        <Separator className="my-3" />

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal ({totals.totalTons} tons)</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          {totals.volumeDiscount > 0 && (
            <div className="flex justify-between">
              <span className="text-green-600 font-medium">Volume Discount</span>
              <span className="text-green-600 font-medium">
                -${totals.volumeDiscount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax (7.25%)</span>
            <span>${totals.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Card Processing (4.5%)</span>
            <span>${totals.processingFee.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="text-amber-700">${totals.total.toFixed(2)}</span>
          </div>
        </div>

        <Button
          className="w-full mt-4 gap-2 font-semibold"
          size="lg"
          onClick={onCheckout}
        >
          <CreditCard className="h-4 w-4" />
          Proceed to Checkout
        </Button>
      </CardContent>
    </Card>
  );
}
