import { create } from "zustand";

interface ChatState {
  isOpen: boolean;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  visitorId: string;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  addMessage: (message: { role: "user" | "assistant"; content: string }) => void;
  clearMessages: () => void;
}

function generateVisitorId(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("mm-visitor-id");
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem("mm-visitor-id", id);
    return id;
  }
  return "server";
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  messages: [],
  visitorId: typeof window !== "undefined" ? generateVisitorId() : "server",
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
}));

interface QuoteState {
  items: Array<{ productName: string; quantity: string }>;
  addItem: (item: { productName: string; quantity: string }) => void;
  removeItem: (index: number) => void;
  clearItems: () => void;
}

export const useQuoteStore = create<QuoteState>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),
  removeItem: (index) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    })),
  clearItems: () => set({ items: [] }),
}));

interface CartItem {
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (product: { name: string; price: number; unit: string }) => void;
  updateQuantity: (name: string, delta: number) => void;
  setQuantity: (name: string, qty: number) => void;
  removeFromCart: (name: string) => void;
  clearCart: () => void;
}

function loadCartFromStorage(): CartItem[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("mm-cart");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
    }
  }
  return [];
}

function saveCartToStorage(items: CartItem[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("mm-cart", JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }
}

export const useCartStore = create<CartState>((set) => ({
  items: typeof window !== "undefined" ? loadCartFromStorage() : [],
  addToCart: (product) =>
    set((state) => {
      const existing = state.items.find((item) => item.name === product.name);
      const newItems = existing
        ? state.items.map((item) =>
            item.name === product.name
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [
            ...state.items,
            { name: product.name, price: product.price, unit: product.unit, quantity: 1 },
          ];
      saveCartToStorage(newItems);
      return { items: newItems };
    }),
  updateQuantity: (name, delta) =>
    set((state) => {
      const newItems = state.items
        .map((item) =>
          item.name === name
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0);
      saveCartToStorage(newItems);
      return { items: newItems };
    }),
  setQuantity: (name, qty) =>
    set((state) => {
      const newItems =
        qty <= 0
          ? state.items.filter((item) => item.name !== name)
          : state.items.map((item) =>
              item.name === name ? { ...item, quantity: qty } : item
            );
      saveCartToStorage(newItems);
      return { items: newItems };
    }),
  removeFromCart: (name) =>
    set((state) => {
      const newItems = state.items.filter((item) => item.name !== name);
      saveCartToStorage(newItems);
      return { items: newItems };
    }),
  clearCart: () => {
    saveCartToStorage([]);
    set({ items: [] });
  },
}));
