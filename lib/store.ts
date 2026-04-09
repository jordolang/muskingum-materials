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
