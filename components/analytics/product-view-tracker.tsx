"use client";

import { useEffect } from "react";
import { trackProductView } from "@/lib/analytics";

interface ProductViewTrackerProps {
  itemId: string;
  itemName: string;
  price: number;
  category?: string;
}

export function ProductViewTracker({
  itemId,
  itemName,
  price,
  category,
}: ProductViewTrackerProps) {
  useEffect(() => {
    trackProductView({
      itemId,
      itemName,
      price,
      category,
    });
  }, [itemId, itemName, price, category]);

  return null;
}
