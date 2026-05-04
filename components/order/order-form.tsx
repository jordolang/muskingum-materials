"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BUSINESS_INFO } from "@/data/business";
import { useToast } from "@/lib/use-toast";
import { useCartStore } from "@/lib/store";
import { OrderConfirmation } from "./order-confirmation";
import { ProductCatalog } from "./product-catalog";
import { CartSummary } from "./cart-summary";
import { CheckoutForm } from "./checkout-form";

export interface OrderableProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  imageUrl?: string;
  imageAlt?: string;
}

export const checkoutSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  smsOptIn: z.boolean().optional(),
  fulfillment: z.enum(["pickup", "delivery"]),
  deliveryAddress: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

export type CheckoutData = z.infer<typeof checkoutSchema>;

interface OrderFormProps {
  products: OrderableProduct[];
}

export function OrderForm({ products }: OrderFormProps) {
  const cart = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);

  const [step, setStep] = useState<"products" | "checkout" | "complete">("products");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const { toast } = useToast();

  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");
  const handledProductParamRef = useRef<string | null>(null);

  useEffect(() => {
    if (!productParam) return;
    if (handledProductParamRef.current === productParam) return;
    handledProductParamRef.current = productParam;

    const match = products.find(
      (p) => p.name.toLowerCase() === productParam.toLowerCase() && p.price > 0
    );
    if (!match) return;

    const alreadyInCart = useCartStore
      .getState()
      .items.some((item) => item.name === match.name);
    if (!alreadyInCart) {
      addToCart({ name: match.name, price: match.price, unit: match.unit });
      toast({
        title: "Added to your order",
        description: `${match.name} is ready to customize below.`,
      });
    }
  }, [productParam, addToCart, toast, products]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { fulfillment: "pickup" },
  });

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * BUSINESS_INFO.taxRate;
    const processingFee = subtotal * BUSINESS_INFO.creditProcessingFee;
    const total = subtotal + tax + processingFee;
    const totalTons = cart.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, volumeDiscount: 0, tax, processingFee, total, totalTons };
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
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please call (740) 319-0183 to place your order.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    clearCart();
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
            products={products}
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
