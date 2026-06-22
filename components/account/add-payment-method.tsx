"use client";

import { useState, useEffect, useRef } from "react";
import { loadStripe, Stripe, StripeElements, StripeCardElement } from "@stripe/stripe-js";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AddPaymentMethodProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddPaymentMethod({ onSuccess, onCancel }: AddPaymentMethodProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [cardElement, setCardElement] = useState<StripeCardElement | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const cardElementRef = useRef<HTMLDivElement>(null);

  // Initialize Stripe
  useEffect(() => {
    async function initStripe() {
      try {
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

        if (!publishableKey || publishableKey === "your_stripe_publishable_key") {
          setError("Payment processing is not configured. Please contact support.");
          setLoading(false);
          return;
        }

        const stripeInstance = await loadStripe(publishableKey);
        if (!stripeInstance) {
          setError("Failed to load payment processor. Please try again.");
          setLoading(false);
          return;
        }

        setStripe(stripeInstance);

        // Get SetupIntent client secret from API
        const res = await fetch("/api/account/payment-methods/setup-intent", {
          method: "POST",
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to initialize payment setup");
          setLoading(false);
          return;
        }

        const { clientSecret: secret, customerId: custId } = await res.json();
        setClientSecret(secret);
        setCustomerId(custId);

        // Create Elements instance
        const elementsInstance = stripeInstance.elements({
          clientSecret: secret,
        });
        setElements(elementsInstance);

        // Create and mount card element
        const cardEl = elementsInstance.create("card", {
          style: {
            base: {
              fontSize: "16px",
              color: "#1f2937",
              fontFamily: "system-ui, -apple-system, sans-serif",
              "::placeholder": {
                color: "#9ca3af",
              },
            },
            invalid: {
              color: "#ef4444",
              iconColor: "#ef4444",
            },
          },
        });

        if (cardElementRef.current) {
          cardEl.mount(cardElementRef.current);
        }

        cardEl.on("change", (event) => {
          setCardComplete(event.complete);
          setError(event.error ? event.error.message : null);
        });

        setCardElement(cardEl);
        setLoading(false);
      } catch (err) {
        setError("Failed to initialize payment form");
        setLoading(false);
      }
    }

    initStripe();

    // Cleanup
    return () => {
      if (cardElement) {
        cardElement.unmount();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !cardElement || !clientSecret) {
      setError("Payment form not ready. Please refresh and try again.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Confirm the SetupIntent
      const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        setError(confirmError.message || "Failed to save payment method");
        setSubmitting(false);
        return;
      }

      if (!setupIntent?.payment_method) {
        setError("Failed to save payment method");
        setSubmitting(false);
        return;
      }

      // Get payment method ID from SetupIntent
      const paymentMethodId = typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method.id;

      // Save to our database - backend will retrieve full details from Stripe
      const saveRes = await fetch("/api/account/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripePaymentMethodId: paymentMethodId,
          stripeCustomerId: customerId,
          isDefault,
        }),
      });

      if (!saveRes.ok) {
        const data = await saveRes.json();
        setError(data.error || "Failed to save payment method");
        setSubmitting(false);
        return;
      }

      // Success!
      onSuccess();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-lg border-t-4 border-t-amber-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !clientSecret) {
    return (
      <Card className="border-0 shadow-lg border-t-4 border-t-red-500">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Unable to load payment form</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
          <Button onClick={onCancel} variant="outline" className="mt-4">
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg border-t-4 border-t-amber-500">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-amber-600" />
          Add Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Element Container */}
          <div>
            <label className="text-sm font-medium mb-2 block">Card Information</label>
            <div
              ref={cardElementRef}
              className="border rounded-md p-3 bg-background"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Set as Default Checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="set-default"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="mt-1"
            />
            <label
              htmlFor="set-default"
              className="text-sm cursor-pointer"
            >
              <span className="font-medium">Set as default payment method</span>
              <p className="text-muted-foreground mt-0.5">
                Use this card as your primary payment method for orders
              </p>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={submitting || !cardComplete}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Payment Method"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>

          {/* Security Note */}
          <p className="text-xs text-muted-foreground text-center">
            Your payment information is encrypted and securely processed by Stripe.
            We never store your full card number.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
