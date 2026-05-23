/**
 * Shared utility functions for common operations
 * Provides className merging, price formatting, and phone number formatting
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines and merges className values using clsx and tailwind-merge
 * Handles conditional classes and resolves Tailwind CSS conflicts
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged className string with Tailwind conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as USD currency
 * @param price - Numeric price value
 * @returns Formatted price string (e.g., "$12.34")
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(price);
}

/**
 * Formats a phone number string to (XXX) XXX-XXXX format
 * @param phone - Phone number string (digits only or any format)
 * @returns Formatted phone number, or original string if not 10 digits
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}
