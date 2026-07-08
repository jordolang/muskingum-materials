"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
] as const;

export interface QuoteFormData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  quantity: string | null;
  deliveryAddr: string | null;
  notes: string | null;
  status: string;
}

interface QuoteFormProps {
  quote?: QuoteFormData;
}

export function QuoteForm({ quote }: QuoteFormProps) {
  const router = useRouter();
  const isEdit = Boolean(quote);

  const [name, setName] = useState(quote?.name ?? "");
  const [email, setEmail] = useState(quote?.email ?? "");
  const [phone, setPhone] = useState(quote?.phone ?? "");
  const [company, setCompany] = useState(quote?.company ?? "");
  const [quantity, setQuantity] = useState(quote?.quantity ?? "");
  const [deliveryAddr, setDeliveryAddr] = useState(quote?.deliveryAddr ?? "");
  const [notes, setNotes] = useState(quote?.notes ?? "");
  const [status, setStatus] = useState(quote?.status ?? "pending");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
        quantity: quantity.trim() || undefined,
        deliveryAddr: deliveryAddr.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
      };

      const res = await fetch(
        isEdit ? `/api/admin/quotes/${quote!.id}` : "/api/admin/quotes",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error || "Failed to save quote request.");
        return;
      }

      router.push("/admin/quotes");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Quote Request Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(740) 000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 20 tons"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deliveryAddr">Delivery Address</Label>
            <Textarea
              id="deliveryAddr"
              value={deliveryAddr}
              onChange={(e) => setDeliveryAddr(e.target.value)}
              placeholder="Street, City, OH ZIP"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details about the request"
              rows={4}
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
          {isEdit ? "Save Changes" : "Create Quote Request"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/quotes")}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
