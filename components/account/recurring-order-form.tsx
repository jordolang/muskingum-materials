"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const recurringOrderFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  company: z.string().optional(),
  productId: z.string().min(1, "Product is required"),
  productName: z.string().min(1, "Product name is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  deliveryNotes: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  nextDeliveryDate: z.string().min(1, "Next delivery date is required"),
});

type RecurringOrderFormData = z.infer<typeof recurringOrderFormSchema>;

interface RecurringOrderFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const PRODUCTS = [
  { id: "bank-run", name: "Bank Run", unit: "ton" },
  { id: "fill-dirt", name: "Fill Dirt", unit: "ton" },
  { id: "fill-sand-washed", name: "Fill Sand (Washed)", unit: "ton" },
  { id: "topsoil-unprocessed", name: "Topsoil (Unprocessed)", unit: "ton" },
  { id: "4-fractured-gravel-washed", name: "#4 Fractured Gravel (Washed)", unit: "ton" },
  { id: "9-gravel-washed", name: "#9 Gravel (Washed)", unit: "ton" },
  { id: "8-gravel-washed", name: "#8 Gravel (Washed)", unit: "ton" },
  { id: "57-gravel-washed", name: "#57 Gravel (Washed)", unit: "ton" },
  { id: "304-crushed-gravel", name: "#304 Crushed Gravel", unit: "ton" },
  { id: "oversized-gravel-washed", name: "Oversized Gravel (Washed)", unit: "ton" },
  { id: "57-limestone", name: "#57 Limestone", unit: "ton" },
];

export function RecurringOrderForm({ order, onClose, onSuccess }: RecurringOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!order;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecurringOrderFormData>({
    resolver: zodResolver(recurringOrderFormSchema),
    defaultValues: order
      ? {
          name: order.name,
          email: order.email,
          phone: order.phone,
          company: order.company || "",
          productId: order.items?.[0]?.productId || "",
          productName: order.items?.[0]?.productName || "",
          quantity: order.items?.[0]?.quantity || 1,
          unit: order.items?.[0]?.unit || "ton",
          deliveryAddress: order.deliveryAddress,
          deliveryNotes: order.deliveryNotes || "",
          frequency: order.frequency,
          nextDeliveryDate: order.nextDeliveryDate
            ? new Date(order.nextDeliveryDate).toISOString().split('T')[0]
            : "",
        }
      : {
          frequency: "weekly",
          unit: "ton",
          quantity: 1,
        },
  });

  const selectedProductId = watch("productId");

  useEffect(() => {
    if (selectedProductId) {
      const product = PRODUCTS.find((p) => p.id === selectedProductId);
      if (product) {
        setValue("productName", product.name);
        setValue("unit", product.unit);
      }
    }
  }, [selectedProductId, setValue]);

  async function onSubmit(data: RecurringOrderFormData) {
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company || undefined,
        items: [
          {
            productId: data.productId,
            productName: data.productName,
            quantity: data.quantity,
            unit: data.unit,
          },
        ],
        deliveryAddress: data.deliveryAddress,
        deliveryNotes: data.deliveryNotes || undefined,
        frequency: data.frequency,
        nextDeliveryDate: new Date(data.nextDeliveryDate).toISOString(),
      };

      const url = isEditing
        ? `/api/account/recurring-orders/${order.id}`
        : "/api/account/recurring-orders";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save recurring order");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recurring order");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {isEditing ? "Edit Recurring Order" : "Create Recurring Order"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name")}
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                {...register("email")}
                type="email"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                {...register("phone")}
                type="tel"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="(555) 123-4567"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <input
                {...register("company")}
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Company Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Product <span className="text-red-500">*</span>
              </label>
              <select
                {...register("productId")}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select a product</option>
                {PRODUCTS.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              {errors.productId && (
                <p className="text-red-500 text-sm mt-1">{errors.productId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                {...register("quantity", { valueAsNumber: true })}
                type="number"
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="10"
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Frequency <span className="text-red-500">*</span>
              </label>
              <select
                {...register("frequency")}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
              {errors.frequency && (
                <p className="text-red-500 text-sm mt-1">{errors.frequency.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Next Delivery Date <span className="text-red-500">*</span>
              </label>
              <input
                {...register("nextDeliveryDate")}
                type="date"
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.nextDeliveryDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.nextDeliveryDate.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Delivery Address <span className="text-red-500">*</span>
            </label>
            <input
              {...register("deliveryAddress")}
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="123 Main St, City, State ZIP"
            />
            {errors.deliveryAddress && (
              <p className="text-red-500 text-sm mt-1">
                {errors.deliveryAddress.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Delivery Notes</label>
            <textarea
              {...register("deliveryNotes")}
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Any special instructions for delivery..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update Order"
                : "Create Order"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
