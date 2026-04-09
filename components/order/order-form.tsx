"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Truck,
  MapPin,
  Loader2,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PRODUCTS, BUSINESS_INFO } from "@/data/business";
import { checkoutFormSchema, type CheckoutFormData } from "@/lib/schemas";
import { trackAddToCart, trackBeginCheckout } from "@/lib/analytics";

const ORDERABLE_PRODUCTS = PRODUCTS.filter((p) => p.price > 0);

const PRODUCT_IMAGES: Record<string, string> = {
  "Bank Run": "/images/products/bank-run.jpg",
  "Fill Dirt": "/images/products/fill-dirt.jpg",
  "Fill Sand": "/images/products/fill-sand.jpg",
  "Topsoil (Unprocessed)": "/images/products/topsoil.jpg",
  "#8 Fractured Gravel (Washed)": "/images/products/fractured-gravel.jpg",
  "#9 Gravel (Washed)": "/images/products/fine-gravel.jpg",
  "#8 Gravel (Washed)": "/images/photos/stone-close-up.jpg",
  "#57 Gravel (Washed)": "/images/photos/piles-close-up.jpg",
  "304 Crushed Gravel": "/images/photos/piles-7.jpg",
  "Oversized Gravel (Washed)": "/images/photos/stone-hand.jpg",
  "#57 Limestone": "/images/photos/boulders.jpg",
};

interface CartItem {
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

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
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { fulfillment: "pickup" },
  });

  const fulfillment = watch("fulfillment");

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

    // Track add to cart event
    trackAddToCart({
      itemId: product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      itemName: product.name,
      price: product.price,
      quantity: 1,
      category: "Bulk Materials",
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

  function proceedToCheckout() {
    // Track begin checkout event
    trackBeginCheckout({
      value: totals.total,
      items: cart.map((item) => ({
        itemId: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        itemName: item.name,
        price: item.price,
        quantity: item.quantity,
        category: "Bulk Materials",
      })),
    });

    // Proceed to checkout step
    setStep("checkout");
  }

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * BUSINESS_INFO.taxRate;
    const processingFee = subtotal * BUSINESS_INFO.creditProcessingFee;
    const total = subtotal + tax + processingFee;
    const totalTons = cart.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, tax, processingFee, total, totalTons };
  }, [cart]);

  async function onCheckout(data: CheckoutFormData) {
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

  if (step === "complete") {
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
          <Button onClick={() => { setCart([]); setStep("products"); }}>
            Place Another Order
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Product Selection */}
      {step === "products" && (
        <>
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-amber-600" />
                Select Products
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose your materials and quantity in tons. Prices effective 07/01/2025.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {ORDERABLE_PRODUCTS.map((product) => {
                  const inCart = cart.find((item) => item.name === product.name);
                  return (
                    <div
                      key={product.name}
                      className={`flex items-center gap-4 p-4 transition-colors ${
                        inCart ? "bg-amber-50/50" : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="relative h-14 w-14 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={PRODUCT_IMAGES[product.name] || "/images/photos/piles.jpg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-amber-700">
                          ${product.price.toFixed(2)}
                          <span className="text-xs font-normal text-muted-foreground">
                            /{product.unit}
                          </span>
                        </p>
                      </div>
                      <div className="shrink-0">
                        {inCart ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(product.name, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={inCart.quantity}
                              onChange={(e) =>
                                setQuantity(product.name, parseInt(e.target.value) || 0)
                              }
                              className="w-16 h-8 text-center text-sm"
                              min="0"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(product.name, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToCart(product)}
                            className="gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <Card className="shadow-lg border-0 border-t-4 border-t-amber-500">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.name)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
                  onClick={proceedToCheckout}
                >
                  <CreditCard className="h-4 w-4" />
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Step 2: Checkout */}
      {step === "checkout" && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-600" />
                Checkout
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setStep("products")}>
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
      )}
    </div>
  );
}
