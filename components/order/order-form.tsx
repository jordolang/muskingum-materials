"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ShoppingCart,
  Sparkles,
  ClipboardList,
  CreditCard,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BUSINESS_INFO } from "@/data/business";
import { useToast } from "@/lib/use-toast";
import { logger } from "@/lib/logger";
import { useCartStore } from "@/lib/store";
import { OrderConfirmation } from "./order-confirmation";
import { ProductCatalog } from "./product-catalog";
import { OrderStep, type OrderStepStatus } from "./order-step";
import {
  ProjectEstimator,
  type ProjectSiteData,
} from "./project-estimator";
import { FulfillmentSection } from "./fulfillment-section";
import { ContactSection } from "./contact-section";

export interface OrderableProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  imageUrl?: string;
  imageAlt?: string;
}

export const checkoutSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(10, "Phone number is required"),
    smsOptIn: z.boolean().optional(),
    termsAccepted: z.literal(true, {
      errorMap: () => ({
        message: "You must accept the Terms of Service to proceed",
      }),
    }),
    fulfillment: z.enum(["pickup", "delivery"]),
    deliveryAddress: z.string().optional(),
    deliveryNotes: z.string().optional(),
  })
  .refine(
    (data) =>
      data.fulfillment !== "delivery" ||
      (data.deliveryAddress && data.deliveryAddress.trim().length > 5),
    {
      message: "Delivery address is required",
      path: ["deliveryAddress"],
    },
  );

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

  const [siteData, setSiteData] = useState<ProjectSiteData | null>(null);
  const projectAddress = siteData?.address ?? "";
  const estimate = siteData?.estimate ?? null;
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [view, setView] = useState<"flow" | "complete">("flow");
  const { toast } = useToast();

  // Honor `?product=<name>` deep-links from the catalog so jumping straight
  // to /order with a preselected product still drops it in the cart and
  // surfaces a confirmation toast.
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");
  const handledProductParamRef = useRef<string | null>(null);

  useEffect(() => {
    if (!productParam) return;
    if (handledProductParamRef.current === productParam) return;
    handledProductParamRef.current = productParam;

    const match = products.find(
      (p) => p.name.toLowerCase() === productParam.toLowerCase() && p.price > 0,
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

  const handleSiteDataChange = useCallback((data: ProjectSiteData) => {
    setSiteData(data);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange",
    defaultValues: { fulfillment: "pickup" },
  });

  const fulfillment = watch("fulfillment");
  const deliveryAddress = watch("deliveryAddress");

  const totals = useMemo(() => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const tax = subtotal * BUSINESS_INFO.taxRate;
    // The card-processing fee runs through the merchant on the full
    // amount Stripe charges (subtotal + tax). Keep this in lockstep with
    // lib/validate-checkout-prices.ts so the server-side validation
    // doesn't reject the order with a "Processing fee mismatch".
    const processingFee =
      (subtotal + tax) * BUSINESS_INFO.creditProcessingFee;
    const total = subtotal + tax + processingFee;
    const totalTons = cart.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, volumeDiscount: 0, tax, processingFee, total, totalTons };
  }, [cart]);

  // Step status flags
  const hasAddress = projectAddress.trim().length > 0;
  const hasCart = cart.length > 0;
  const fulfillmentSelected =
    fulfillment === "pickup" ||
    (fulfillment === "delivery" && (deliveryAddress?.trim().length ?? 0) > 5);

  const stepStatus = (n: 1 | 2 | 3 | 4): OrderStepStatus => {
    if (n === 1) return hasAddress ? "complete" : "active";
    if (n === 2) {
      if (!hasAddress) return "locked";
      return hasCart ? "complete" : "active";
    }
    if (n === 3) {
      if (!hasCart) return "locked";
      return fulfillmentSelected ? "complete" : "active";
    }
    if (!fulfillmentSelected) return "locked";
    return "active";
  };

  // Soft scroll to the next active step when it unlocks
  const lastActiveStepRef = useRef<number>(1);
  useEffect(() => {
    let next = 1;
    if (hasAddress) next = 2;
    if (hasCart) next = 3;
    if (fulfillmentSelected) next = 4;

    if (next !== lastActiveStepRef.current) {
      lastActiveStepRef.current = next;
      const el = document.getElementById(`order-step-${next}`);
      if (el && next > 1) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    }
  }, [hasAddress, hasCart, fulfillmentSelected]);

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
          projectSite: siteData ?? undefined,
        }),
      });
      const result = await response.json();
      if (result.url) {
        window.location.href = result.url;
      } else if (result.orderNumber) {
        setOrderNumber(result.orderNumber);
        setView("complete");
      } else {
        throw new Error(result.error || "Checkout failed");
      }
    } catch (error) {
      logger.error("Checkout error:", error);
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: error instanceof Error ? error.message : `Something went wrong. Please try again or call us at ${BUSINESS_INFO.phone} to place your order.`,
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    clearCart();
    setView("flow");
  }

  if (view === "complete") {
    return <OrderConfirmation orderNumber={orderNumber} onReset={handleReset} />;
  }

  return (
    <form onSubmit={handleSubmit(onCheckout)} className="space-y-6">
      {/* STEP 1 — PROJECT ESTIMATE */}
      <div id="order-step-1" className="scroll-mt-20">
        <OrderStep
          stepNumber={1}
          title="Project Estimate"
          subtitle="Tell us where the project is and we'll suggest how much material you'll need."
          status={stepStatus(1)}
          badge={
            estimate ? (
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-100">
                <Sparkles className="mr-1 h-3 w-3" />
                ~{estimate.tons.toFixed(1)} tons recommended
              </Badge>
            ) : undefined
          }
        >
          <ProjectEstimator onSiteDataChange={handleSiteDataChange} />
        </OrderStep>
      </div>

      {/* STEP 2 — SELECT MATERIALS */}
      <div id="order-step-2" className="scroll-mt-20">
        <OrderStep
          stepNumber={2}
          title="Select Materials"
          subtitle="Pick the products and tonnage that match your project."
          status={stepStatus(2)}
          lockedMessage="Enter your project address above to start selecting materials."
          badge={
            hasCart ? (
              <Badge variant="secondary">
                <ShoppingCart className="mr-1 h-3 w-3" />
                {cart.length} item{cart.length !== 1 ? "s" : ""}
              </Badge>
            ) : undefined
          }
        >
          {estimate && (
            <div className="mx-5 mt-5 rounded-lg border border-amber-300/60 bg-amber-50/70 p-3 text-sm">
              <p className="font-medium text-amber-900">
                <Sparkles className="inline h-3.5 w-3.5 mr-1" />
                Quick Estimate suggests roughly{" "}
                <strong>{estimate.tons.toFixed(1)} tons</strong> total. Round up
                ~5–10% for compaction and waste.
              </p>
            </div>
          )}
          <div className="p-5 pt-3">
            <ProductCatalog
              products={products}
              cart={cart}
              onAddToCart={addToCart}
              onUpdateQuantity={updateQuantity}
              onSetQuantity={setQuantity}
            />
          </div>
        </OrderStep>
      </div>

      {/* STEP 3 — REVIEW & FULFILLMENT */}
      <div id="order-step-3" className="scroll-mt-20">
        <OrderStep
          stepNumber={3}
          title="Review & Fulfillment"
          subtitle="Confirm your order and choose pickup or delivery."
          status={stepStatus(3)}
          lockedMessage="Add at least one product to continue."
          badge={
            hasCart ? (
              <Badge variant="outline" className="font-semibold">
                ${totals.total.toFixed(2)}
              </Badge>
            ) : undefined
          }
        >
          <CartReview
            cart={cart}
            totals={totals}
            onRemove={removeFromCart}
            onUpdateQuantity={updateQuantity}
          />
          <Separator />
          <FulfillmentSection
            register={register}
            watch={watch}
            errors={errors}
            setValue={setValue}
            prefillAddress={projectAddress}
          />
        </OrderStep>
      </div>

      {/* STEP 4 — CHECKOUT */}
      <div id="order-step-4" className="scroll-mt-20">
        <OrderStep
          stepNumber={4}
          title="Contact & Payment"
          subtitle="We use this to send your receipt and order updates."
          status={stepStatus(4)}
          lockedMessage="Choose pickup or delivery to continue."
          badge={
            <Badge variant="outline" className="gap-1">
              <CreditCard className="h-3 w-3" />
              Secure
            </Badge>
          }
        >
          <ContactSection
            register={register}
            errors={errors}
            isProcessing={isProcessing}
            total={totals.total}
            canSubmit={hasCart && fulfillmentSelected && isValid}
          />
        </OrderStep>
      </div>
    </form>
  );
}

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

function CartReview({
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
                  className="h-7 w-7 inline-flex items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                  aria-label={`Decrease ${item.name}`}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
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
                  className="h-7 w-7 inline-flex items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={`Increase ${item.name}`}
                >
                  <Plus className="h-3 w-3" />
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
