"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface OrderConfirmationProps {
  orderNumber: string;
  onReset: () => void;
}

export function OrderConfirmation({ orderNumber, onReset }: OrderConfirmationProps) {
  return (
    <Card className="shadow-lg border-0">
      <CardContent className="p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order Submitted!</h2>
        <p className="text-muted-foreground mb-2">
          Your order number is{" "}
          <span className="font-bold text-foreground">{orderNumber}</span>
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          We&apos;ll review your order and contact you to confirm. Payment will
          be processed when your order is ready.
        </p>
        <Button onClick={onReset}>
          Place Another Order
        </Button>
      </CardContent>
    </Card>
  );
}
