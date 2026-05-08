"use client";

import { Loader2, CreditCard } from "lucide-react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckoutData } from "./order-form";

interface ContactSectionProps {
  register: UseFormRegister<CheckoutData>;
  errors: FieldErrors<CheckoutData>;
  isProcessing: boolean;
  total: number;
  canSubmit: boolean;
}

export function ContactSection({
  register,
  errors,
  isProcessing,
  total,
  canSubmit,
}: ContactSectionProps) {
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

      <Button
        type="submit"
        className="w-full gap-2 font-semibold"
        size="lg"
        disabled={isProcessing || !canSubmit}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            Pay ${total.toFixed(2)}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Secure payment powered by Stripe. Visa, Mastercard, Discover, Apple Pay,
        and Google Pay accepted.
      </p>
    </div>
  );
}
