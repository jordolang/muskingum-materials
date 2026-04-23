"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PRODUCTS, BUSINESS_INFO } from "@/data/business";
import { OrderConfirmation } from "./order-confirmation";
import { ProductCatalog } from "./product-catalog";
import { CartSummary } from "./cart-summary";
import { CheckoutForm } from "./checkout-form";

const ORDERABLE_PRODUCTS = PRODUCTS.filter((p) => p.price > 0);

interface CartItem {
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

export const checkoutSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  fulfillment: z.enum(["pickup", "delivery"]),
  deliveryAddress: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

export type CheckoutData = z.infer<typeof checkoutSchema>;

export function OrderForm() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<"products" | "checkout" | "complete">("products");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { fulfillment: "pickup" },
  });

  function addToCart(product: (typeof ORDERABLE_PRODUCTS)[number]) {
    setCart((prev) => {
      const existing = prev.find((item) => item.name === product.name);
      if (existing) {
        return prev.map((item) =>
          item.name === product.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        { name: product.name, price: product.price, unit: product.unit, quantity: 1 },
      ];
    });
  }

  function updateQuantity(name: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.name === name
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function setQuantity(name: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.name !== name));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.name === name ? { ...item, quantity: qty } : item
        )
      );
    }
  }

  function removeFromCart(name: string) {
    setCart((prev) => prev.filter((item) => item.name !== name));
  }

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Calculate volume discount based on pricing tiers
    const volumeDiscount = cart.reduce((totalDiscount, item) => {
      const product = ORDERABLE_PRODUCTS.find((p) => p.name === item.name);
      if (!product || !('pricingTiers' in product) || !product.pricingTiers) return totalDiscount;

      // Find the highest applicable tier based on quantity
      const applicableTier = product.pricingTiers
        .filter((tier) => item.quantity >= tier.minQuantity)
        .sort((a, b) => b.minQuantity - a.minQuantity)[0];

      if (applicableTier) {
        const discount = (item.price - applicableTier.pricePerTon) * item.quantity;
        return totalDiscount + discount;
      }

      return totalDiscount;
    }, 0);

    const discountedSubtotal = subtotal - volumeDiscount;
    const tax = discountedSubtotal * BUSINESS_INFO.taxRate;
    const processingFee = discountedSubtotal * BUSINESS_INFO.creditProcessingFee;
    const total = discountedSubtotal + tax + processingFee;
    const totalTons = cart.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, volumeDiscount, tax, processingFee, total, totalTons };
  }, [cart]);

  async function onCheckout(data: CheckoutData) {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items: cart,
          subtotal: totals.subtotal,
          volumeDiscount: totals.volumeDiscount,
          tax: totals.tax,
          processingFee: totals.processingFee,
          total: totals.total,
        }),
      });

      const result = await response.json();

      if (result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else if (result.orderNumber) {
        // Fallback if Stripe not configured
        setOrderNumber(result.orderNumber);
        setStep("complete");
      } else {
        throw new Error(result.error || "Checkout failed");
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please call (740) 319-0183 to place your order."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setCart([]);
    setStep("products");
  }

  if (step === "complete") {
    return <OrderConfirmation orderNumber={orderNumber} onReset={handleReset} />;
  }

  return (
    <div className="space-y-6">
      {step === "products" && (
        <>
          <ProductCatalog
            cart={cart}
            onAddToCart={addToCart}
            onUpdateQuantity={updateQuantity}
            onSetQuantity={setQuantity}
          />
          <CartSummary
            cart={cart}
            totals={totals}
            onRemoveItem={removeFromCart}
            onCheckout={() => setStep("checkout")}
          />
        </>
      )}

      {step === "checkout" && (
        <CheckoutForm
          cart={cart}
          totals={totals}
          register={register}
          errors={errors}
          watch={watch}
          handleSubmit={handleSubmit}
          onCheckout={onCheckout}
          isProcessing={isProcessing}
          onBack={() => setStep("products")}
        />
      )}
    </div>
  );
}
