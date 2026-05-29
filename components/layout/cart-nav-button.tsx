"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";

export function CartNavButton() {
  const count = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  if (count === 0) return null;

  return (
    <Link href="/order">
      <Button variant="ghost" size="sm" className="relative">
        <ShoppingCart className="h-4 w-4" />
        <span className="sr-only">View cart</span>
        <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
          {count > 9 ? "9+" : count}
        </span>
      </Button>
    </Link>
  );
}
