/**
 * Zustand state management stores for client-side application state
 * Provides chat and quote functionality with localStorage persistence
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
    try {
      const stored = window.localStorage.getItem("mm-visitor-id");
      if (stored) return stored;
      const id = crypto.randomUUID();
      window.localStorage.setItem("mm-visitor-id", id);
      return id;
    } catch {
      // localStorage can throw or be unavailable (Safari private mode,
      // sandboxed iframes, storage disabled, or a test env without a shim).
      // Fall back to a session-only id instead of crashing store init.
      return crypto.randomUUID();
    }
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
 * @example
 * ```tsx
 * import { useQuoteStore } from "@/lib/store";
 *
 * function QuoteBuilder() {
 *   const { items, addItem, removeItem, clearItems } = useQuoteStore();
 *
 *   const handleAddProduct = () => {
 *     addItem({ productName: "River Rock", quantity: "5 tons" });
 *   };
 *
 *   return (
 *     <div>
 *       {items.map((item, i) => (
 *         <div key={i}>
 *           {item.productName} - {item.quantity}
 *           <button onClick={() => removeItem(i)}>Remove</button>
 *         </div>
 *       ))}
 *       <button onClick={handleAddProduct}>Add Product</button>
 *     </div>
 *   );
 * }
 * ```
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
