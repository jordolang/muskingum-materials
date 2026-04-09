"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Pencil, Trash2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SavedOrderCardProps {
  savedOrder: {
    id: string;
    name: string;
    items: Array<{ name: string; quantity: number; unit: string }>;
    pickupOrDeliver: string;
    deliveryAddress: string | null;
    createdAt: Date;
  };
  onUpdate?: () => void;
}

export function SavedOrderCard({ savedOrder, onUpdate }: SavedOrderCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  function handleUseTemplate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Construct URL params with saved order data
    const params = new URLSearchParams();
    params.set("reorder", "true");
    params.set("items", JSON.stringify(savedOrder.items));
    params.set("pickupOrDeliver", savedOrder.pickupOrDeliver);

    if (savedOrder.deliveryAddress) {
      params.set("deliveryAddress", savedOrder.deliveryAddress);
    }

    // Navigate to order page with pre-fill data
    router.push(`/order?${params.toString()}`);
  }

  function handleEdit(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement edit functionality in next subtask
    // This could open a modal or navigate to an edit page
  }

  async function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete "${savedOrder.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/account/saved-orders/${savedOrder.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete saved order");
      }

      // Refresh the page data
      if (onUpdate) {
        onUpdate();
      } else {
        router.refresh();
      }
    } catch (error) {
      alert("Failed to delete saved order. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card className="border-0 shadow-md hover:shadow-lg transition-all">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Bookmark className="h-4 w-4 text-amber-600" />
                <p className="font-bold text-sm">{savedOrder.name}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Saved{" "}
                {new Date(savedOrder.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {savedOrder.items
                  .map(
                    (i) =>
                      `${i.name} (${i.quantity} ${i.unit}${i.quantity !== 1 ? "s" : ""})`
                  )
                  .join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground capitalize">
                  {savedOrder.pickupOrDeliver}
                </p>
                {savedOrder.deliveryAddress && (
                  <p className="text-xs text-muted-foreground">Delivery saved</p>
                )}
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleUseTemplate}
                className="gap-1.5 shrink-0"
              >
                Use Template
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="gap-1.5 shrink-0"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="gap-1.5 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
