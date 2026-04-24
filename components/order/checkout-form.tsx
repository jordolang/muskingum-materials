"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormHandleSubmit } from "react-hook-form";
import { Loader2, CreditCard, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BUSINESS_INFO } from "@/data/business";
import type { CheckoutData } from "./order-form";

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

interface CartItem {
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

interface Totals {
  subtotal: number;
  tax: number;
  processingFee: number;
  total: number;
  totalTons: number;
}

interface CheckoutFormProps {
  cart: CartItem[];
  totals: Totals;
  register: UseFormRegister<CheckoutData>;
  errors: FieldErrors<CheckoutData>;
  watch: UseFormWatch<CheckoutData>;
  handleSubmit: UseFormHandleSubmit<CheckoutData>;
  onCheckout: (data: CheckoutData) => void;
  isProcessing: boolean;
  onBack: () => void;
}

export function CheckoutForm({
  cart,
  totals,
  register,
  errors,
  watch,
  handleSubmit,
  onCheckout,
  isProcessing,
  onBack,
}: CheckoutFormProps) {
  const { user, isLoaded } = useUser();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const fulfillment = watch("fulfillment");

  const loadAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/account/profile");
      const data = await res.json();
      setAddresses(data.profile?.addresses || []);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      loadAddresses();
    }
  }, [isLoaded, user, loadAddresses]);

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-600" />
            Checkout
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back to Products
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onCheckout)} className="space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name *</label>
                <Input placeholder="Your full name" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone *</label>
                <Input placeholder="(740) 555-0123" {...register("phone")} />
                {errors.phone && (
                  <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium mb-1 block">Email *</label>
              <Input type="email" placeholder="your@email.com" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Fulfillment */}
          <div>
            <h3 className="font-semibold mb-3">Pickup or Delivery</h3>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  fulfillment === "pickup"
                    ? "border-amber-500 bg-amber-50"
                    : "border-border hover:border-amber-300"
                }`}
              >
                <input
                  type="radio"
                  value="pickup"
                  {...register("fulfillment")}
                  className="sr-only"
                />
                <MapPin className={`h-5 w-5 ${fulfillment === "pickup" ? "text-amber-600" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-semibold text-sm">Pickup</p>
                  <p className="text-xs text-muted-foreground">At our yard</p>
                </div>
              </label>
              <label
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  fulfillment === "delivery"
                    ? "border-amber-500 bg-amber-50"
                    : "border-border hover:border-amber-300"
                }`}
              >
                <input
                  type="radio"
                  value="delivery"
                  {...register("fulfillment")}
                  className="sr-only"
                />
                <Truck className={`h-5 w-5 ${fulfillment === "delivery" ? "text-amber-600" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-semibold text-sm">Delivery</p>
                  <p className="text-xs text-muted-foreground">To your site</p>
                </div>
              </label>
            </div>

            {fulfillment === "pickup" && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Pickup Location:</p>
                <p>{BUSINESS_INFO.address}, {BUSINESS_INFO.city}, {BUSINESS_INFO.state} {BUSINESS_INFO.zip}</p>
                <p>Hours: {BUSINESS_INFO.hours}</p>
              </div>
            )}

            {fulfillment === "delivery" && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Delivery Address *</label>
                  <Textarea
                    placeholder="Street address, city, state, zip"
                    {...register("deliveryAddress")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Delivery Notes</label>
                  <Textarea
                    placeholder="Gate code, site instructions, etc."
                    rows={2}
                    {...register("deliveryNotes")}
                  />
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                  Delivery fees vary by distance. We&apos;ll confirm the delivery fee
                  and total before processing payment.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Order Summary */}
          <div>
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              {cart.map((item) => (
                <div key={item.name} className="flex justify-between">
                  <span>
                    {item.name} x {item.quantity} {item.unit}{item.quantity !== 1 ? "s" : ""}
                  </span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-amber-700">${totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gap-2 font-semibold"
            size="lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Pay ${totals.total.toFixed(2)}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Stripe. We accept Visa, Mastercard,
            Discover, Apple Pay, and Google Pay.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
