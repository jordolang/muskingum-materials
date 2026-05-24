"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/analytics";

interface PurchaseTrackerProps {
  orderNumber: string;
}

export function PurchaseTracker({ orderNumber }: PurchaseTrackerProps) {
  useEffect(() => {
    // Retrieve analytics data from sessionStorage
    const analyticsData = sessionStorage.getItem("orderAnalytics");
    if (!analyticsData) return;

    try {
      const data = JSON.parse(analyticsData);

      // Verify this is the correct order
      if (data.orderNumber === orderNumber) {
        // Track the purchase event
        trackPurchase({
          transactionId: data.orderNumber,
          value: data.total,
          tax: data.tax,
          items: data.items.map((item: { id: string; name: string; price: number; quantity: number }) => ({
            itemId: item.id,
            itemName: item.name,
            price: item.price,
            quantity: item.quantity,
            category: "Bulk Materials",
          })),
        });

        // Clear the analytics data after tracking
        sessionStorage.removeItem("orderAnalytics");
      }
    } catch (error) {
      console.error("Failed to track purchase:", error);
    }
  }, [orderNumber]);

  return null;
}
