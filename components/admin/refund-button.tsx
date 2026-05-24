"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RefundButtonProps {
  orderId: string;
  orderNumber: string;
  orderTotal: number;
}

export function RefundButton({ orderId, orderNumber, orderTotal }: RefundButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(orderTotal.toFixed(2));
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFullRefund = Math.abs(parseFloat(amount) - orderTotal) < 0.01;

  async function handleRefund() {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid refund amount");
      return;
    }
    if (parsedAmount > orderTotal) {
      setError(`Cannot exceed order total of $${orderTotal.toFixed(2)}`);
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount, reason: reason.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Refund failed");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
          <RotateCcw className="h-4 w-4" />
          Issue Refund
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Refund — {orderNumber}</DialogTitle>
          <DialogDescription>
            Refunds are processed via Stripe and appear within 5–10 business days. A confirmation
            email will be sent to the customer automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="refund-amount">
              Refund amount{" "}
              <span className="text-muted-foreground font-normal">
                (max ${orderTotal.toFixed(2)})
              </span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={orderTotal}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
              />
            </div>
            {isFullRefund && (
              <p className="text-xs text-amber-600 font-medium">Full refund — order will be canceled</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="refund-reason">Reason</Label>
            <Textarea
              id="refund-reason"
              placeholder="e.g. Customer canceled before delivery, duplicate order…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRefund} disabled={loading}>
            {loading ? "Processing…" : `Refund $${parseFloat(amount || "0").toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
