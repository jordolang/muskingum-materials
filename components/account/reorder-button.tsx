"use client";

import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReorderButtonProps {
  orderData: {
    items: Array<{ name: string; quantity: number; unit: string }>;
    pickupOrDeliver: string;
    deliveryAddress?: string | null;
  };
}

export function ReorderButton({ orderData }: ReorderButtonProps) {
  const router = useRouter();

  function handleReorder(e: React.MouseEvent) {
    // Prevent the Link click event from firing
    e.preventDefault();
    e.stopPropagation();

    // Construct URL params with order data
    const params = new URLSearchParams();
    params.set("reorder", "true");
    params.set("items", JSON.stringify(orderData.items));
    params.set("pickupOrDeliver", orderData.pickupOrDeliver);

    if (orderData.deliveryAddress) {
      params.set("deliveryAddress", orderData.deliveryAddress);
    }

    // Navigate to order page with pre-fill data
    router.push(`/order?${params.toString()}`);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReorder}
      className="gap-1.5 shrink-0"
    >
      <RotateCw className="h-3.5 w-3.5" />
      Reorder
    </Button>
  );
}
