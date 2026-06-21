import { z } from "zod";

/**
 * Regex for visitorId validation.
 * Allows only letters, numbers, hyphens, and underscores.
 *
 * Note: This is intentionally stricter than prior versions which also permitted
 * dots (.) and other special characters. The change was made to prevent prompt
 * injection via crafted visitorId values. Any client generating IDs with dots
 * or special chars (e.g., "visitor.123") will need to be updated to use only
 * [a-zA-Z0-9_-] characters.
 */
export const VISITOR_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

// Contact form schema
export const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// Payment method enum for checkout
export const paymentMethodEnum = z.enum([
  "stripe",
  "purchase_order",
  "net_terms",
  "saved_payment_method",
]);

// Base checkout form schema (without refinements, for extending)
const checkoutFormBaseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  fulfillment: z.enum(["pickup", "delivery"]),
  deliveryAddress: z.string().optional(),
  deliveryNotes: z.string().optional(),
  smsOptIn: z.boolean().optional(),
  paymentMethod: paymentMethodEnum.default("stripe"),
  purchaseOrderNumber: z.string().optional(),
  savedPaymentMethodId: z.string().optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({
      message: "You must accept the Terms of Service to proceed",
    }),
  }),
});

// Checkout form schema (client-side) with payment method validation
export const checkoutFormSchema = checkoutFormBaseSchema.refine(
  (data) => {
    // Require PO number when payment method is purchase_order
    if (data.paymentMethod === "purchase_order" && !data.purchaseOrderNumber) {
      return false;
    }
    return true;
  },
  {
    message: "Purchase order number is required for PO payments",
    path: ["purchaseOrderNumber"],
  }
).refine(
  (data) => {
    // Require saved payment method ID when payment method is saved_payment_method
    if (data.paymentMethod === "saved_payment_method" && !data.savedPaymentMethodId) {
      return false;
    }
    return true;
  },
  {
    message: "Saved payment method ID is required",
    path: ["savedPaymentMethodId"],
  }
);

// Project site data schema — captures the customer's outline, address,
// and material estimate from the on-site map estimator so the same data
// flows onto the order receipt and to Muskingum Materials.
export const projectSiteSchema = z
  .object({
    address: z.string().optional(),
    location: z
      .object({ lat: z.number(), lng: z.number() })
      .nullable()
      .optional(),
    mode: z.enum(["map", "dimensions", "preset"]).optional(),
    depthInches: z.number().nonnegative().optional(),
    lengthFt: z.number().nonnegative().nullable().optional(),
    widthFt: z.number().nonnegative().nullable().optional(),
    totalAreaSqFt: z.number().nonnegative().optional(),
    polygons: z
      .array(z.array(z.object({ lat: z.number(), lng: z.number() })))
      .optional(),
    estimate: z
      .object({
        cubicFeet: z.number(),
        cubicYards: z.number(),
        tons: z.number(),
        truckloads: z.number(),
        source: z.enum(["map", "dimensions"]),
      })
      .nullable()
      .optional(),
  })
  .optional();

// Delivery access checklist schema — validates customer's answers to access questions
// (driveway width, overhead clearance, turning room, surface type, gate codes) to
// identify potential delivery constraints before checkout.
export const deliveryAccessChecklistSchema = z
  .object({
    drivewayWidth: z.enum(["10ft_or_more", "less_than_10ft", "unknown"]).optional(),
    overheadClearance: z.enum(["14ft_or_more", "less_than_14ft", "unknown"]).optional(),
    turningRoom: z.enum(["adequate", "tight", "unknown"]).optional(),
    surface: z.enum(["paved", "gravel", "dirt", "grass", "other"]).optional(),
    gateCode: z.string().optional(),
    accessInstructions: z.string().optional(),
  })
  .optional();

// Drop location schema — validates customer's precise drop-location instructions
// including free-text notes, optional photo, and map pin coordinates.
export const dropLocationSchema = z
  .object({
    notes: z.string().optional(),
    photoUrl: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  })
  .optional();

// Access warning flags schema — array of flagged delivery access issues
// detected from checklist answers (e.g., narrow_driveway, low_clearance).
export const accessWarningFlagsSchema = z
  .array(z.enum(["narrow_driveway", "low_clearance", "tight_turning", "poor_surface"]))
  .optional();

// Checkout schema (API-side with order details)
export const checkoutSchema = checkoutFormBaseSchema.extend({
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
  contractorId: z.string().optional(),
  contractorDiscountRate: z.number().optional(),
  contractorDiscount: z.number().optional(),
  projectSite: projectSiteSchema,
  deliveryAccessChecklist: deliveryAccessChecklistSchema,
  dropLocation: dropLocationSchema,
  accessWarnings: accessWarningFlagsSchema,
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
  smsOptIn: z.boolean().optional(),
});

// Profile update schema (API-side with optional fields)
export const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  isContractor: z.boolean().optional(),
  contractorDiscount: z.number().min(0).max(100).optional(),
  smsOptIn: z.boolean().optional(),
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

// Recurring order schemas
export const createRecurringOrderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  company: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      productName: z.string(),
      quantity: z.number().positive("Quantity must be greater than 0"),
      unit: z.string(),
    })
  ).min(1, "At least one item is required"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  deliveryNotes: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly'], {
    errorMap: () => ({ message: "Frequency must be daily, weekly, biweekly, or monthly" })
  }),
  nextDeliveryDate: z.string().datetime("Invalid date format"),
});

export const updateRecurringOrderSchema = createRecurringOrderSchema.partial().extend({
  status: z.enum(['active', 'paused', 'cancelled']).optional(),
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

// Order status update schema
export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "ready",
    "ready_for_pickup",
    "out_for_delivery",
    "completed",
    "cancelled",
  ]),
  statusNotes: z.string().optional(),
});

// Point redemption schema
export const pointRedemptionSchema = z.object({
  points: z.number().min(1, "Points must be at least 1"),
  rewardId: z.string().optional(),
  notes: z.string().optional(),
});

// Campaign schema
export const campaignSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  templateId: z.string().optional(),
  scheduledFor: z.coerce.date().optional(),
  recipientFilter: z.string().optional(),
});

// Saved payment method schema
export const savedPaymentMethodCreateSchema = z.object({
  stripePaymentMethodId: z.string().min(1, "Stripe payment method ID is required"),
  stripeCustomerId: z.string().optional(),
  brand: z.string().optional(),
  last4: z.string().optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2024).optional(),
  isDefault: z.boolean().optional(),
});

export const savedPaymentMethodUpdateSchema = z.object({
  isDefault: z.boolean().optional(),
});

// Type exports for convenience
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;
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
export type CreateRecurringOrderData = z.infer<typeof createRecurringOrderSchema>;
export type UpdateRecurringOrderData = z.infer<typeof updateRecurringOrderSchema>;
export type ReviewData = z.infer<typeof reviewSchema>;
export type OrderStatusUpdateData = z.infer<typeof orderStatusUpdateSchema>;
export type PointRedemptionData = z.infer<typeof pointRedemptionSchema>;
export type CampaignData = z.infer<typeof campaignSchema>;
export type SavedPaymentMethodCreateData = z.infer<typeof savedPaymentMethodCreateSchema>;
export type SavedPaymentMethodUpdateData = z.infer<typeof savedPaymentMethodUpdateSchema>;
export type DeliveryAccessChecklistData = z.infer<typeof deliveryAccessChecklistSchema>;
export type DropLocationData = z.infer<typeof dropLocationSchema>;
export type AccessWarningFlags = z.infer<typeof accessWarningFlagsSchema>;
