/**
 * Zustand state management stores for client-side application state
 * Provides chat, quote, and shopping cart functionality with localStorage persistence
 */

import { create } from "zustand";

interface ChatState {
  /** Whether the chat widget is currently open */
  isOpen: boolean;
  /** Array of chat messages exchanged with the assistant */
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  /** Unique identifier for this visitor, persisted across sessions */
  visitorId: string;
  /** Opens the chat widget */
  openChat: () => void;
  /** Closes the chat widget */
  closeChat: () => void;
  /** Toggles the chat widget open/closed state */
  toggleChat: () => void;
  /** Adds a new message to the conversation */
  addMessage: (message: { role: "user" | "assistant"; content: string }) => void;
  /** Clears all messages from the conversation */
  clearMessages: () => void;
}

/**
 * Generates or retrieves a unique visitor identifier
 * The ID is persisted in localStorage to maintain visitor identity across sessions
 * @returns The visitor's unique identifier, or "server" if running server-side
 */
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

/**
 * Zustand store for managing chat widget state and conversation history
 * Handles opening/closing the widget, message management, and visitor identification
 * @example
 * ```tsx
 * import { useChatStore } from "@/lib/store";
 *
 * function ChatWidget() {
 *   const { isOpen, messages, openChat, closeChat, addMessage } = useChatStore();
 *
 *   return (
 *     <div>
 *       {isOpen && <ChatBox messages={messages} />}
 *       <button onClick={openChat}>Open Chat</button>
 *     </div>
 *   );
 * }
 * ```
 */
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
  /** Array of items being quoted with product names and quantities */
  items: Array<{ productName: string; quantity: string }>;
  /** Adds a new item to the quote request */
  addItem: (item: { productName: string; quantity: string }) => void;
  /** Removes an item from the quote request by index */
  removeItem: (index: number) => void;
  /** Clears all items from the quote request */
  clearItems: () => void;
}

/**
 * Zustand store for managing quote request items
 * Allows building a list of products and quantities before submitting a quote request
 */
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
  /** Unit of measurement (e.g., "ton", "yard") */
  unit: string;
  quantity: number;
}

interface CartState {
  /** Array of items currently in the cart */
  items: CartItem[];
  /** Adds a product to the cart or increments quantity if already present */
  addToCart: (product: { name: string; price: number; unit: string }) => void;
  /** Updates quantity by a delta value (can be positive or negative) */
  updateQuantity: (name: string, delta: number) => void;
  /** Sets the exact quantity for an item, removes if quantity is 0 or less */
  setQuantity: (name: string, qty: number) => void;
  /** Removes a specific item from the cart by name */
  removeFromCart: (name: string) => void;
  /** Clears all items from the cart */
  clearCart: () => void;
}

/**
 * Loads cart items from localStorage
 * Handles parsing errors gracefully by returning an empty array
 * @returns Array of cart items from localStorage, or empty array if none found or on error
 */
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

/**
 * Persists cart items to localStorage
 * Silently handles storage errors to prevent cart operations from failing
 * @param items - Array of cart items to persist
 */
function saveCartToStorage(items: CartItem[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("mm-cart", JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }
}

/**
 * Zustand store for managing shopping cart state with localStorage persistence
 * Automatically syncs cart state to localStorage on every change
 * Supports adding items, updating quantities, and clearing the cart
 */
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
