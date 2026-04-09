"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const addressSchema = z.object({
  label: z.string().min(1, "Label is required"),
  street: z.string().min(3, "Street is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(5, "ZIP is required"),
  isDefault: z.boolean().optional(),
});

type AddressData = z.infer<typeof addressSchema>;

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: "Home", state: "OH", isDefault: false },
  });

  const loadAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/account/profile");
      const data = await res.json();
      setAddresses(data.profile?.addresses || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  async function onSubmit(data: AddressData) {
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      reset({ label: "Home", state: "OH", isDefault: false, street: "", city: "", zip: "" });
      setShowForm(false);
      loadAddresses();
    }
  }

  async function deleteAddress(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/account/addresses?id=${id}`, { method: "DELETE" });
      loadAddresses();
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
          <h1 className="text-2xl font-bold font-heading">Addresses</h1>
          <p className="text-sm text-muted-foreground">
            Save delivery addresses for faster checkout
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Address
        </Button>
      </div>

      {showForm && (
        <Card className="border-0 shadow-lg border-t-4 border-t-amber-500">
          <CardHeader>
            <CardTitle className="text-lg">New Address</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Label</label>
                <Input placeholder="Home, Work, Job Site, etc." {...register("label")} />
                {errors.label && <p className="text-xs text-destructive mt-1">{errors.label.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Street Address</label>
                <Input placeholder="123 Main St" {...register("street")} />
                {errors.street && <p className="text-xs text-destructive mt-1">{errors.street.message}</p>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <Input placeholder="Zanesville" {...register("city")} />
                  {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">State</label>
                  <Input placeholder="OH" {...register("state")} />
                  {errors.state && <p className="text-xs text-destructive mt-1">{errors.state.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">ZIP</label>
                  <Input placeholder="43701" {...register("zip")} />
                  {errors.zip && <p className="text-xs text-destructive mt-1">{errors.zip.message}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isDefault" {...register("isDefault")} className="rounded" />
                <label htmlFor="isDefault" className="text-sm">Set as default delivery address</label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Address
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {addresses.length === 0 && !showForm ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <MapPin className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No saved addresses</h2>
            <p className="text-muted-foreground mb-6">
              Add a delivery address to speed up your next order.
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <Card key={addr.id} className="border-0 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold text-sm">{addr.label}</span>
                    {addr.isDefault && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Star className="h-3 w-3" /> Default
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={() => deleteAddress(addr.id)}
                    disabled={deleting === addr.id}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    {deleting === addr.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{addr.street}</p>
                <p className="text-sm text-muted-foreground">
                  {addr.city}, {addr.state} {addr.zip}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
