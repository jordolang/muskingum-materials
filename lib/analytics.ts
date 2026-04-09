// Type definitions for Google Analytics gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

// GA4 Event parameter types
interface BaseEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
}

interface ItemParams {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
  item_variant?: string;
}

interface EcommerceParams {
  currency?: string;
  value: number;
  items: ItemParams[];
  transaction_id?: string;
  tax?: number;
  shipping?: number;
}

interface LeadParams {
  currency?: string;
  value?: number;
}

// Generic event tracking
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("event", eventName, params);
}

// Page view tracking
export function trackPageView(url: string): void {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("event", "page_view", {
    page_path: url,
  });
}

// E-commerce: Product view
export function trackProductView(params: {
  itemId: string;
  itemName: string;
  price: number;
  category?: string;
}): void {
  trackEvent("view_item", {
    currency: "USD",
    value: params.price,
    items: [
      {
        item_id: params.itemId,
        item_name: params.itemName,
        price: params.price,
        quantity: 1,
        item_category: params.category,
      },
    ],
  });
}

// E-commerce: Add to cart
export function trackAddToCart(params: {
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
  category?: string;
}): void {
  trackEvent("add_to_cart", {
    currency: "USD",
    value: params.price * params.quantity,
    items: [
      {
        item_id: params.itemId,
        item_name: params.itemName,
        price: params.price,
        quantity: params.quantity,
        item_category: params.category,
      },
    ],
  });
}

// E-commerce: Begin checkout
export function trackBeginCheckout(params: {
  value: number;
  items: Array<{
    itemId: string;
    itemName: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
}): void {
  trackEvent("begin_checkout", {
    currency: "USD",
    value: params.value,
    items: params.items.map((item) => ({
      item_id: item.itemId,
      item_name: item.itemName,
      price: item.price,
      quantity: item.quantity,
      item_category: item.category,
    })),
  });
}

// E-commerce: Purchase
export function trackPurchase(params: {
  transactionId: string;
  value: number;
  tax?: number;
  shipping?: number;
  items: Array<{
    itemId: string;
    itemName: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
}): void {
  trackEvent("purchase", {
    currency: "USD",
    transaction_id: params.transactionId,
    value: params.value,
    tax: params.tax || 0,
    shipping: params.shipping || 0,
    items: params.items.map((item) => ({
      item_id: item.itemId,
      item_name: item.itemName,
      price: item.price,
      quantity: item.quantity,
      item_category: item.category,
    })),
  });
}

// Lead generation: Quote request
export function trackLead(params: {
  value?: number;
  leadSource?: string;
  productCount?: number;
}): void {
  trackEvent("generate_lead", {
    currency: "USD",
    value: params.value || 0,
    lead_source: params.leadSource || "quote_form",
    product_count: params.productCount,
  });
}

// Contact form submission
export function trackContact(params: { subject?: string }): void {
  trackEvent("contact_form_submit", {
    event_category: "engagement",
    event_label: params.subject || "general",
  });
}

// Chat widget opened
export function trackChatOpened(params?: { visitorId?: string }): void {
  trackEvent("chat_opened", {
    event_category: "engagement",
    visitor_id: params?.visitorId,
  });
}
