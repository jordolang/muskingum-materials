/**
 * Email service utility with Postmark integration
 * Provides reusable email sending functionality with graceful degradation
 */

import { logger } from "@/lib/logger";

/**
 * Simple email parameters for backward-compatible boolean return variant
 */
export interface SimpleEmailParams {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  replyTo?: string;
}

/**
 * Email message structure for sending emails
 */
export interface EmailMessage {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  from?: string;
  replyTo?: string;
  tag?: string;
  metadata?: Record<string, string>;
}

/**
 * Result of email send operation
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email template types for tracking and categorization
 */
export type EmailTemplate =
  | "contact-form"
  | "quote-request"
  | "order-confirmation"
  | "order-status"
  | "newsletter-welcome"
  | "newsletter-broadcast"
  | "lead-notification"
  | "chat-reply";

/**
 * Order status types for order notification emails
 */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

/**
 * Order item structure for email notifications
 */
export interface OrderItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

/**
 * Order email data structure
 */
export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  processingFee: number;
  deliveryFee?: number;
  total: number;
  pickupOrDeliver: "pickup" | "deliver";
  deliveryAddress?: string;
  deliveryNotes?: string;
  status: OrderStatus;
  statusNotes?: string;
}

/**
 * Gets or creates a Postmark client instance
 * Returns null if POSTMARK_API_TOKEN is not configured
 */
async function getPostmarkClient() {
  if (!process.env.POSTMARK_API_TOKEN) {
    return null;
  }

  try {
    const postmark = await import("postmark");
    return new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);
  } catch (error) {
    logger.error("Failed to initialize Postmark client", error);
    return null;
  }
}

/**
 * Gets the default "From" email address
 */
function getDefaultFromEmail(): string {
  return process.env.POSTMARK_FROM_EMAIL || "noreply@muskingummaterials.com";
}

/**
 * Gets the default recipient email for notifications
 */
function getDefaultToEmail(): string {
  return process.env.POSTMARK_TO_EMAIL || "sales@muskingummaterials.com";
}

/**
 * Order email template structure
 */
interface OrderEmailTemplate {
  subject: string | ((data: OrderEmailData) => string);
  getBody: (data: OrderEmailData) => string;
}

/**
 * Formats order items list for email body
 */
function formatItemsList(items: OrderItem[]): string {
  return items
    .map((item) =>
      `  - ${item.name}: ${item.quantity} ${item.unit}${item.quantity !== 1 ? "s" : ""} @ $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}`
    )
    .join("\n");
}

/**
 * Formats complete order summary for email body
 */
function formatOrderSummary(data: OrderEmailData): string {
  const deliveryInfo = data.pickupOrDeliver === "deliver" && data.deliveryAddress
    ? `\nDelivery Address: ${data.deliveryAddress}${data.deliveryNotes ? `\nDelivery Notes: ${data.deliveryNotes}` : ""}`
    : "";

  return `
Order #: ${data.orderNumber}
Customer: ${data.customerName}
Email: ${data.customerEmail}
${data.customerPhone ? `Phone: ${data.customerPhone}` : ""}
Fulfillment: ${data.pickupOrDeliver === "pickup" ? "Pickup at yard" : "Delivery"}${deliveryInfo}

Items:
${formatItemsList(data.items)}

Subtotal: $${data.subtotal.toFixed(2)}
Tax (7.25%): $${data.tax.toFixed(2)}
Processing Fee (4.5%): $${data.processingFee.toFixed(2)}
${data.deliveryFee ? `Delivery Fee: $${data.deliveryFee.toFixed(2)}\n` : ""}Total: $${data.total.toFixed(2)}
  `.trim();
}

/**
 * Order status email templates
 */
const ORDER_EMAIL_TEMPLATES: Record<OrderStatus, OrderEmailTemplate> = {
  pending: {
    subject: (data) => `Order ${data.orderNumber} - Payment Pending`,
    getBody: (data) => `
Hi ${data.customerName},

Thank you for placing your order with Muskingum Materials!

Your order has been received and is pending payment confirmation.

${formatOrderSummary(data)}

What's Next:
- Complete your payment to proceed with order processing
- Once payment is confirmed, we'll begin preparing your materials
- You'll receive email updates at each stage of your order

Questions? Call us at (740) 319-0183 or reply to this email.

Best regards,
Muskingum Materials Team
    `.trim(),
  },

  confirmed: {
    subject: (data) => `Order ${data.orderNumber} Confirmed - We're On It!`,
    getBody: (data) => `
Hi ${data.customerName},

Great news! Your order has been confirmed and we're getting started.

${formatOrderSummary(data)}

What's Next:
- Our team will begin processing your order
- You'll receive an update when your materials are being prepared
- ${data.pickupOrDeliver === "pickup"
    ? "We'll notify you when your order is ready for pickup"
    : "We'll keep you informed about your delivery schedule"}

Questions? Call us at (740) 319-0183 or reply to this email.

Best regards,
Muskingum Materials Team
    `.trim(),
  },

  processing: {
    subject: (data) => `Order ${data.orderNumber} - Now Processing`,
    getBody: (data) => `
Hi ${data.customerName},

Your order is now being processed! Our team is preparing your materials.

${formatOrderSummary(data)}

${data.statusNotes ? `\nUpdate from our team:\n${data.statusNotes}\n` : ""}
What's Next:
- We're currently preparing your ${data.pickupOrDeliver === "pickup" ? "order for pickup" : "materials for delivery"}
- You'll receive another update when your order is ready
- ${data.pickupOrDeliver === "pickup"
    ? "Pickup location: Muskingum Materials, 3855 Frazeysburg Rd, Zanesville, OH 43701"
    : "Our delivery team will contact you to coordinate timing"}

Questions? Call us at (740) 319-0183 or reply to this email.

Best regards,
Muskingum Materials Team
    `.trim(),
  },

  ready: {
    subject: (data) => `Order ${data.orderNumber} - Ready for ${data.pickupOrDeliver === "pickup" ? "Pickup" : "Delivery"}`,
    getBody: (data) => `
Hi ${data.customerName},

Your order is ready!

${formatOrderSummary(data)}

${data.statusNotes ? `\nUpdate from our team:\n${data.statusNotes}\n` : ""}
${data.pickupOrDeliver === "pickup"
  ? `
Pickup Information:
- Location: Muskingum Materials, 3855 Frazeysburg Rd, Zanesville, OH 43701
- Hours: Monday-Friday 7:00 AM - 4:00 PM, Saturday 7:00 AM - 12:00 PM
- Please bring your order number: ${data.orderNumber}

What to Expect:
- Pull up to our loading area
- Give your order number to our team
- We'll load your materials quickly and safely
`
  : `
Delivery Status:
- Your materials are ready for delivery
- Our delivery team will contact you shortly to schedule
- ${data.deliveryAddress ? `Delivery address: ${data.deliveryAddress}` : ""}

What to Expect:
- Delivery coordinator will call to confirm timing
- Please ensure someone is available to direct the driver
- Have the delivery area clear and accessible
`}

Questions? Call us at (740) 319-0183 or reply to this email.

Best regards,
Muskingum Materials Team
    `.trim(),
  },

  ready_for_pickup: {
    subject: (data) => `Order ${data.orderNumber} - Ready for Pickup!`,
    getBody: (data) => `
Hi ${data.customerName},

Your order is ready for pickup at our yard!

${formatOrderSummary(data)}

${data.statusNotes ? `\nUpdate from our team:\n${data.statusNotes}\n` : ""}
Pickup Information:
- Location: Muskingum Materials, 3855 Frazeysburg Rd, Zanesville, OH 43701
- Hours: Monday-Friday 7:00 AM - 4:00 PM, Saturday 7:00 AM - 12:00 PM
- Please bring your order number: ${data.orderNumber}

What to Expect:
- Pull up to our loading area
- Give your order number to our team
- We'll load your materials quickly and safely

Questions? Call us at (740) 319-0183 or reply to this email.

Best regards,
Muskingum Materials Team
    `.trim(),
  },

  out_for_delivery: {
    subject: (data) => `Order ${data.orderNumber} - Out for Delivery`,
    getBody: (data) => `
Hi ${data.customerName},

Your order is on the way!

${formatOrderSummary(data)}

${data.statusNotes ? `\nDelivery Update:\n${data.statusNotes}\n` : ""}
Delivery Information:
${data.deliveryAddress ? `- Address: ${data.deliveryAddress}` : ""}
${data.deliveryNotes ? `- Special Instructions: ${data.deliveryNotes}` : ""}
- Our driver will call if they have questions finding your location
- Please be available to direct placement of materials

What to Expect:
- Driver will arrive at the scheduled time
- Have the delivery area clear and accessible
- Direct the driver where to place materials
- Inspect materials upon delivery

Questions or need to update delivery instructions? Call us at (740) 319-0183.

Best regards,
Muskingum Materials Team
    `.trim(),
  },

  completed: {
    subject: (data) => `Order ${data.orderNumber} - Completed. Thank You!`,
    getBody: (data) => `
Hi ${data.customerName},

Your order has been completed! Thank you for choosing Muskingum Materials.

${formatOrderSummary(data)}

${data.statusNotes ? `\nFinal Notes:\n${data.statusNotes}\n` : ""}
We hope you're satisfied with your order!

Need More Materials?
- Visit our online store: https://muskingummaterials.com/order
- Call us: (740) 319-0183
- Or reply to this email

Have feedback or questions about your order? We'd love to hear from you.

Thank you for your business!

Muskingum Materials Team
    `.trim(),
  },

  cancelled: {
    subject: (data) => `Order ${data.orderNumber} - Cancelled`,
    getBody: (data) => `
Hi ${data.customerName},

Your order has been cancelled.

${formatOrderSummary(data)}

${data.statusNotes ? `\nReason for Cancellation:\n${data.statusNotes}\n` : ""}
If you have questions about this cancellation or would like to place a new order, please contact us:

- Call: (740) 319-0183
- Email: sales@muskingummaterials.com
- Visit: https://muskingummaterials.com

We're here to help!

Best regards,
Muskingum Materials Team
    `.trim(),
  },
};

/**
 * Sends an email via Postmark (simple variant - returns boolean)
 * Falls back gracefully if Postmark is not configured
 *
 * @param params - Simple email parameters
 * @returns true on success, false on failure
 */
export async function sendEmail(params: SimpleEmailParams): Promise<boolean>;

/**
 * Sends an email via Postmark (detailed variant - returns result object)
 * Falls back gracefully if Postmark is not configured
 *
 * @param message - Email message to send
 * @returns Result indicating success or failure with details
 */
export async function sendEmail(message: EmailMessage): Promise<EmailSendResult>;

/**
 * Implementation for both sendEmail variants
 */
export async function sendEmail(
  messageOrParams: EmailMessage | SimpleEmailParams
): Promise<boolean | EmailSendResult> {
  const client = await getPostmarkClient();

  // Detect which variant is being called based on presence of EmailMessage-specific fields
  const isSimpleVariant =
    !("tag" in messageOrParams) &&
    !("metadata" in messageOrParams) &&
    !("from" in messageOrParams);

  if (!client) {
    logger.error("Email service not configured - POSTMARK_API_TOKEN missing", null, {
      to: messageOrParams.to,
      subject: messageOrParams.subject,
    });

    if (isSimpleVariant) {
      return false;
    }
    return {
      success: false,
      error: "Email service not configured",
    };
  }

  try {
    const message = messageOrParams as EmailMessage;
    const response = await client.sendEmail({
      From: message.from || getDefaultFromEmail(),
      To: message.to,
      Subject: message.subject,
      TextBody: message.textBody,
      HtmlBody: message.htmlBody,
      ReplyTo: message.replyTo,
      Tag: message.tag,
      Metadata: message.metadata,
    });

    if (isSimpleVariant) {
      return true;
    }
    return {
      success: true,
      messageId: response.MessageID,
    };
  } catch (error) {
    logger.error("Failed to send email via Postmark", error, {
      to: messageOrParams.to,
      subject: messageOrParams.subject,
      tag: "tag" in messageOrParams ? messageOrParams.tag : undefined,
    });

    if (isSimpleVariant) {
      return false;
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sends a notification email to the default recipient (sales team)
 * Useful for contact forms, quote requests, etc.
 *
 * @param subject - Email subject
 * @param textBody - Email body (plain text)
 * @param options - Optional settings
 * @returns Result indicating success or failure
 */
export async function sendNotificationEmail(
  subject: string,
  textBody: string,
  options?: {
    replyTo?: string;
    tag?: EmailTemplate;
    metadata?: Record<string, string>;
    htmlBody?: string;
  }
): Promise<EmailSendResult> {
  return sendEmail({
    to: getDefaultToEmail(),
    subject,
    textBody,
    htmlBody: options?.htmlBody,
    replyTo: options?.replyTo,
    tag: options?.tag,
    metadata: options?.metadata,
  });
}

/**
 * Sends a transactional email to a customer
 * Used for order confirmations, account notifications, etc.
 *
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param textBody - Email body (plain text)
 * @param options - Optional settings
 * @returns Result indicating success or failure
 */
export async function sendTransactionalEmail(
  to: string,
  subject: string,
  textBody: string,
  options?: {
    htmlBody?: string;
    tag?: EmailTemplate;
    metadata?: Record<string, string>;
  }
): Promise<EmailSendResult> {
  return sendEmail({
    to,
    subject,
    textBody,
    htmlBody: options?.htmlBody,
    tag: options?.tag,
    metadata: options?.metadata,
  });
}

/**
 * Sends a marketing email (newsletter, promotional)
 * Includes tracking metadata for campaign management
 *
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param textBody - Email body (plain text)
 * @param htmlBody - Email body (HTML)
 * @param options - Optional settings
 * @returns Result indicating success or failure
 */
export async function sendMarketingEmail(
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string,
  options?: {
    campaignId?: string;
    tag?: string;
    metadata?: Record<string, string>;
  }
): Promise<EmailSendResult> {
  const metadata: Record<string, string> = {
    ...options?.metadata,
    type: "marketing",
  };

  if (options?.campaignId) {
    metadata.campaignId = options.campaignId;
  }

  return sendEmail({
    to,
    subject,
    textBody,
    htmlBody,
    tag: options?.tag || "newsletter-broadcast",
    metadata,
  });
}

/**
 * Validates email configuration
 * Useful for health checks and startup validation
 *
 * @returns True if email service is properly configured
 */
export async function isEmailServiceConfigured(): Promise<boolean> {
  const client = await getPostmarkClient();
  return client !== null;
}

/**
 * Sends order status notification email to customer
 * Uses the appropriate template based on order status
 *
 * @param data - Order data including customer email and order details
 * @returns Result indicating success or failure
 */
export async function sendOrderStatusEmail(
  data: OrderEmailData
): Promise<EmailSendResult> {
  const template = ORDER_EMAIL_TEMPLATES[data.status];
  if (!template) {
    const error = `No email template for status: ${data.status}`;
    logger.error(error, null, { orderNumber: data.orderNumber, status: data.status });
    return {
      success: false,
      error,
    };
  }

  const subject = typeof template.subject === "function"
    ? template.subject(data)
    : template.subject;
  const textBody = template.getBody(data);

  const result = await sendEmail({
    to: data.customerEmail,
    subject,
    textBody,
    replyTo: getDefaultToEmail(),
    tag: "order-status",
    metadata: {
      orderNumber: data.orderNumber,
      status: data.status,
    },
  });

  if (result.success) {
    logger.info("Order status email sent", {
      orderNumber: data.orderNumber,
      status: data.status,
      to: data.customerEmail,
    });
  }

  return result;
}

/**
 * Sends internal notification email to sales team about order status
 * Non-critical operation - failures are logged but don't throw
 *
 * @param data - Order data
 * @param message - Custom message to include in email
 * @returns Result indicating success or failure
 */
export async function sendInternalOrderNotification(
  data: OrderEmailData,
  message: string
): Promise<EmailSendResult> {
  const subject = `Order ${data.orderNumber} - ${data.status.toUpperCase()} - Internal Notification`;
  const textBody = `
${message}

${formatOrderSummary(data)}

Status: ${data.status}
${data.statusNotes ? `\nStatus Notes: ${data.statusNotes}` : ""}
  `.trim();

  const result = await sendEmail({
    to: getDefaultToEmail(),
    subject,
    textBody,
    replyTo: data.customerEmail,
    tag: "order-status",
    metadata: {
      orderNumber: data.orderNumber,
      status: data.status,
      type: "internal",
    },
  });

  if (result.success) {
    logger.info("Internal order notification sent", {
      orderNumber: data.orderNumber,
      status: data.status,
    });
  } else {
    // Log but don't throw - internal notifications are not critical
    logger.warn("Failed to send internal order notification", {
      orderNumber: data.orderNumber,
      error: result.error,
    });
  }

  return result;
}
