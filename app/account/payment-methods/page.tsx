"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Trash2, CreditCard, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AddPaymentMethod from "@/components/account/add-payment-method";

interface PaymentMethod {
  id: string;
  brand: string | null;
  last4: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  isDefault: boolean;
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadPaymentMethods = useCallback(async () => {
    try {
      const res = await fetch("/api/account/payment-methods");
      const data = await res.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  async function deletePaymentMethod(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/account/payment-methods/${id}`, { method: "DELETE" });
      loadPaymentMethods();
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Payment Methods</h1>
          <p className="text-sm text-muted-foreground">
            Save payment methods for faster checkout
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Card
        </Button>
      </div>

      {showForm && (
        <AddPaymentMethod
          onSuccess={() => {
            setShowForm(false);
            loadPaymentMethods();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {paymentMethods.length === 0 && !showForm ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <CreditCard className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No saved payment methods</h2>
            <p className="text-muted-foreground mb-6">
              Add a payment method to speed up your next order.
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <Card key={method.id} className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold text-sm">
                      {method.brand || "Card"} ••••{method.last4 || "****"}
                    </span>
                    {method.isDefault && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Star className="h-3 w-3" /> Default
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={() => deletePaymentMethod(method.id)}
                    disabled={deleting === method.id}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    {deleting === method.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {method.expiryMonth && method.expiryYear && (
                  <p className="text-sm text-muted-foreground">
                    Expires {String(method.expiryMonth).padStart(2, "0")}/{method.expiryYear}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
