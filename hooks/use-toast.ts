"use client";

import { create } from "zustand";

export type ToastVariant = "default" | "destructive";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const TOAST_LIMIT = 5;
const DEFAULT_DURATION = 5000;

let toastCount = 0;

function generateToastId(): string {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return `toast-${toastCount}-${Date.now()}`;
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = generateToastId();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? DEFAULT_DURATION,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast].slice(-TOAST_LIMIT),
    }));

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, newToast.duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

export function useToast() {
  const { toasts, addToast, removeToast, clearToasts } = useToastStore();

  return {
    toasts,
    toast: addToast,
    dismiss: removeToast,
    clear: clearToasts,
  };
}
