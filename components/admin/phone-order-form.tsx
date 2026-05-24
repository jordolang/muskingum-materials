"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductOption {
  id: string;
  name: string;
  unit: string;
  price: number;
}

interface LineItem {
  name: string;
  unit: string;
  quantity: number;
  price: number;
}

interface PhoneOrderFormProps {
  products: ProductOption[];
}

const TAX_RATE = 0.0725;

function emptyItem(): LineItem {
  return { name: "", unit: "ton", quantity: 1, price: 0 };
}

export function PhoneOrderForm({ products }: PhoneOrderFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function applyProduct(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updateItem(index, { name: product.name, unit: product.unit, price: product.price });
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validItems = items.filter((i) => i.name.trim());
    if (validItems.length === 0) {
      setError("Add at least one item.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/orders/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          items: validItems,
          fulfillment,
          deliveryAddress: deliveryAddress.trim() || undefined,
          deliveryNotes: deliveryNotes.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to create order.");
        return;
      }

      router.push(`/admin/orders/${json.orderId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Info */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(740) 000-0000"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Order Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-12 sm:col-span-4 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Product</Label>
                <Select onValueChange={(v) => applyProduct(index, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick from catalog…" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">Custom / Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-6 sm:col-span-3 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Name *</Label>
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  placeholder="Material name"
                  required={index === 0}
                />
              </div>
              <div className="col-span-6 sm:col-span-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Unit</Label>
                <Input
                  value={item.unit}
                  onChange={(e) => updateItem(index, { unit: e.target.value })}
                  placeholder="ton"
                />
              </div>
              <div className="col-span-4 sm:col-span-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Qty</Label>
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-5 sm:col-span-2 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Price / unit</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.price}
                  onChange={(e) => updateItem(index, { price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-3 sm:col-span-1 flex justify-end pb-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>

          {/* Totals */}
          <div className="border-t pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (7.25%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              No credit card processing fee — payment collected at pickup/delivery.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fulfillment */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Fulfillment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Pickup or Delivery</Label>
            <Select
              value={fulfillment}
              onValueChange={(v) => setFulfillment(v as "pickup" | "delivery")}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">Pickup at yard</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {fulfillment === "delivery" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <Input
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street, City, OH ZIP"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deliveryNotes">Delivery Notes</Label>
                <Textarea
                  id="deliveryNotes"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Gate codes, timing requirements, etc."
                  rows={2}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Staff Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this order (not sent to customer)"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Phone Order
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/orders")}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
