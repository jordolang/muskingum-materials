import { z } from "zod";

// Contact form schema
export const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// Checkout form schema (client-side)
export const checkoutFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  fulfillment: z.enum(["pickup", "delivery"]),
  deliveryAddress: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

// Checkout schema (API-side with order details)
export const checkoutSchema = checkoutFormSchema.extend({
  items: z.array(
    z.object({
      name: z.string(),
      price: z.number(),
      unit: z.string(),
      quantity: z.number().min(1),
    })
  ),
  subtotal: z.number(),
  tax: z.number(),
  processingFee: z.number(),
  total: z.number(),
});

// Address schema
export const addressSchema = z.object({
  label: z.string().min(1, "Label is required"),
  street: z.string().min(3, "Street is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(5, "ZIP is required"),
  isDefault: z.boolean().optional(),
});

// Address update schema (API-side with id and optional fields)
export const addressUpdateSchema = z.object({
  id: z.string().min(1, "Address ID is required"),
  label: z.string().min(1).optional(),
  street: z.string().min(3).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  zip: z.string().min(5).optional(),
  isDefault: z.boolean().optional(),
});

// Profile schema (client-side with required fields)
export const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  company: z.string().optional(),
});

// Profile update schema (API-side with optional fields)
export const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
});

// Quote request schema
export const quoteSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
  products: z.array(
    z.object({
      productName: z.string(),
      quantity: z.string(),
    })
  ),
  deliveryAddr: z.string().optional(),
  notes: z.string().optional(),
});

// Newsletter subscription schema
export const newsletterSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().optional(),
});

// Lead capture schema
export const leadSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.string().default("chat"),
  visitorId: z.string().optional(),
});

// Review submission schema
export const reviewSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required").optional(),
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  text: z.string().min(10, "Review must be at least 10 characters"),
  projectType: z.enum(["driveway", "patio", "landscaping", "commercial", "other"]),
  orderNumber: z.string().optional(),
});

// Type exports for convenience
export type ContactFormData = z.infer<typeof contactSchema>;
export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;
export type CheckoutData = z.infer<typeof checkoutSchema>;
export type AddressData = z.infer<typeof addressSchema>;
export type AddressUpdateData = z.infer<typeof addressUpdateSchema>;
export type ProfileData = z.infer<typeof profileSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type QuoteData = z.infer<typeof quoteSchema>;
export type NewsletterData = z.infer<typeof newsletterSchema>;
export type LeadData = z.infer<typeof leadSchema>;
export type ReviewData = z.infer<typeof reviewSchema>;
