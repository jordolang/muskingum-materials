"use client";

import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/lib/use-toast";

interface AddToCartButtonProps {
  name: string;
  price: number;
  unit: string;
  size?: "sm" | "default";
  className?: string;
}

export function AddToCartButton({
  name,
  price,
  unit,
  size = "sm",
  className,
}: AddToCartButtonProps) {
  const addToCart = useCartStore((s) => s.addToCart);
  const items = useCartStore((s) => s.items);
  const { toast } = useToast();

  const inCart = items.find((i) => i.name === name);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ name, price, unit });
    toast({
      title: `${name} added to cart`,
      description: `${(inCart?.quantity ?? 0) + 1} ton${(inCart?.quantity ?? 0) + 1 !== 1 ? "s" : ""} in cart`,
    });
  }

  return (
    <Button
      size={size}
      variant={inCart ? "secondary" : "default"}
      onClick={handleClick}
      className={className}
    >
      {inCart ? (
        <Check className="h-3.5 w-3.5 mr-1.5" />
      ) : (
        <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
      )}
      {inCart ? `In Cart (${inCart.quantity})` : "Add to Cart"}
    </Button>
  );
}
