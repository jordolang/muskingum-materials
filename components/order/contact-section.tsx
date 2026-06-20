"use client";

import Link from "next/link";
import { Loader2, CreditCard, FileText } from "lucide-react";
import { UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { CheckoutData, UserProfile } from "./order-form";

interface ContactSectionProps {
  register: UseFormRegister<CheckoutData>;
  errors: FieldErrors<CheckoutData>;
  watch: UseFormWatch<CheckoutData>;
  isProcessing: boolean;
  total: number;
  canSubmit: boolean;
  userProfile: UserProfile | null;
  paymentMethod: string;
}

export function ContactSection({
  register,
  errors,
  watch,
  isProcessing,
  total,
  canSubmit,
  userProfile,
  paymentMethod,
}: ContactSectionProps) {
  // Check if user is approved contractor
  const isApprovedContractor =
    userProfile?.isContractor && userProfile?.netTermsApproved;

  // Determine button text based on payment method
  const getButtonText = () => {
    if (isProcessing) return "Processing…";
    if (paymentMethod === "purchase_order") return "Submit Order";
    if (paymentMethod === "net_terms") return "Place Order on Account";
    return `Pay $${total.toFixed(2)}`;
  };

  const getButtonIcon = () => {
    if (isProcessing) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (paymentMethod === "purchase_order") return <FileText className="h-4 w-4" />;
    return <CreditCard className="h-4 w-4" />;
  };
  return (
    <div className="space-y-5 p-5">
      <h3 className="font-semibold">Contact Information</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="text-sm font-medium mb-1 block">
            Name *
          </label>
          <Input
            id="contact-name"
            placeholder="Your full name"
            autoComplete="name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive mt-1">
              {errors.name.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="contact-phone" className="text-sm font-medium mb-1 block">
            Phone *
          </label>
          <Input
            id="contact-phone"
            type="tel"
            placeholder="(740) 555-0123"
            autoComplete="tel"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-destructive mt-1">
              {errors.phone.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="contact-email" className="text-sm font-medium mb-1 block">
          Email *
        </label>
        <Input
          id="contact-email"
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Payment Method Selection (only for approved contractors) */}
      {isApprovedContractor && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Payment Method *</Label>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) => {
              const event = { target: { name: "paymentMethod", value } };
              register("paymentMethod").onChange(event);
            }}
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="stripe" id="payment-stripe" />
              <Label htmlFor="payment-stripe" className="flex-1 cursor-pointer">
                <div className="font-medium">Credit Card</div>
                <div className="text-xs text-muted-foreground">
                  Pay now with Stripe (Visa, Mastercard, Discover, Apple Pay)
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="purchase_order" id="payment-po" />
              <Label htmlFor="payment-po" className="flex-1 cursor-pointer">
                <div className="font-medium">Purchase Order</div>
                <div className="text-xs text-muted-foreground">
                  Pay with purchase order number
                </div>
              </Label>
            </div>

            {userProfile.netTermsCreditLimit && userProfile.netTermsCreditLimit > 0 && (
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="net_terms" id="payment-net-terms" />
                <Label htmlFor="payment-net-terms" className="flex-1 cursor-pointer">
                  <div className="font-medium">
                    Net {userProfile.netTermsLength} Terms
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Pay on account (${userProfile.netTermsCreditLimit.toLocaleString()} credit limit)
                  </div>
                </Label>
              </div>
            )}
          </RadioGroup>

          {/* Purchase Order Number Input (conditional) */}
          {paymentMethod === "purchase_order" && (
            <div>
              <Label htmlFor="purchase-order-number" className="text-sm font-medium mb-1 block">
                Purchase Order Number *
              </Label>
              <Input
                id="purchase-order-number"
                placeholder="PO-12345"
                {...register("purchaseOrderNumber")}
              />
              {errors.purchaseOrderNumber && (
                <p className="text-xs text-destructive mt-1">
                  {errors.purchaseOrderNumber.message}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <label htmlFor="contact-sms-opt-in" className="flex items-start gap-3 cursor-pointer">
        <Checkbox id="contact-sms-opt-in" {...register("smsOptIn")} className="mt-1" />
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Send me SMS order updates (optional)
          </p>
          <p className="text-xs text-muted-foreground">
            By checking this box, you consent to receive automated text messages
            about your order status and delivery updates at the phone number
            provided. Message and data rates may apply. Reply STOP to opt out.
          </p>
        </div>
      </label>

      <label htmlFor="contact-terms" className="flex items-start gap-3 cursor-pointer">
        <Checkbox id="contact-terms" {...register("termsAccepted")} className="mt-1" />
        <div className="space-y-1">
          <p className="text-sm font-medium">
            I agree to the{" "}
            <Link
              href="/terms"
              target="_blank"
              className="text-primary underline hover:no-underline"
            >
              Terms of Service &amp; Delivery Agreement
            </Link>{" "}
            *
          </p>
          <p className="text-xs text-muted-foreground">
            Required. Includes the delivery access requirements, surface-damage
            waiver, weight tolerance, and cancellation policy.
          </p>
        </div>
      </label>
      {errors.termsAccepted && (
        <p className="text-xs text-destructive -mt-2">
          {errors.termsAccepted.message}
        </p>
      )}

      <Button
        type="submit"
        className="w-full gap-2 font-semibold"
        size="lg"
        disabled={isProcessing || !canSubmit}
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>

      {paymentMethod === "stripe" ? (
        <p className="text-xs text-center text-muted-foreground">
          Secure payment powered by Stripe. Visa, Mastercard, Discover, Apple Pay,
          and Google Pay accepted.
        </p>
      ) : paymentMethod === "purchase_order" ? (
        <p className="text-xs text-center text-muted-foreground">
          Your order will be processed upon receipt of purchase order.
        </p>
      ) : paymentMethod === "net_terms" ? (
        <p className="text-xs text-center text-muted-foreground">
          Invoice will be sent with Net {userProfile?.netTermsLength} payment terms.
        </p>
      ) : null}
    </div>
  );
}
