"use client";

import * as React from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RestockNotifyButtonProps {
  productId: string;
  productName: string;
}

export function RestockNotifyButton({
  productId,
  productName,
}: RestockNotifyButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/restock-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setIsSuccess(true);
      setEmail("");
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to subscribe. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-800">
          <Check className="h-5 w-5" />
          <p className="text-sm font-medium">
            Success! We&apos;ll notify you when {productName} is back in stock.
          </p>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="mt-4">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setIsOpen(true)}
        >
          <Bell className="h-4 w-4" />
          Notify Me When Back in Stock
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="text-sm font-medium mb-1 block">
            Enter your email to get notified when {productName} is back in stock:
          </label>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="flex-1"
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subscribing...
                </>
              ) : (
                "Subscribe"
              )}
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
