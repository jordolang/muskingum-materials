import postmark from "postmark";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export interface OrderItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

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

interface EmailTemplate {
  subject: string;
  getBody: (data: OrderEmailData) => string;
}

function formatItemsList(items: OrderItem[]): string {
  return items
    .map((item) =>
      `  - ${item.name}: ${item.quantity} ${item.unit}${item.quantity !== 1 ? "s" : ""} @ $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}`
    )
    .join("\n");
}

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

const EMAIL_TEMPLATES: Record<OrderStatus, EmailTemplate> = {
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
 * Send order status notification email to customer
 *
 * @param data - Order data including customer email and order details
 * @returns Promise that resolves when email is sent
 * @throws Error if Postmark is not configured or email send fails
 */
export async function sendOrderStatusEmail(data: OrderEmailData): Promise<void> {
  // Check if Postmark is configured
  if (!process.env.POSTMARK_API_TOKEN) {
    console.error("Postmark not configured - email not sent");
    return;
  }

  const template = EMAIL_TEMPLATES[data.status];
  if (!template) {
    console.error(`No email template for status: ${data.status}`);
    return;
  }

  try {
    const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);

    await client.sendEmail({
      From: process.env.POSTMARK_FROM_EMAIL || "noreply@muskingummaterials.com",
      To: data.customerEmail,
      Subject: typeof template.subject === "function" ? template.subject(data) : template.subject,
      TextBody: template.getBody(data),
      ReplyTo: "sales@muskingummaterials.com",
    });

    console.log(`Order status email sent: ${data.orderNumber} (${data.status}) to ${data.customerEmail}`);
  } catch (error) {
    console.error(`Failed to send order status email for ${data.orderNumber}:`, error);
    throw error;
  }
}

/**
 * Send internal notification email to sales team
 *
 * @param data - Order data
 * @param message - Custom message to include in email
 */
export async function sendInternalOrderNotification(
  data: OrderEmailData,
  message: string
): Promise<void> {
  if (!process.env.POSTMARK_API_TOKEN) {
    console.error("Postmark not configured - internal notification not sent");
    return;
  }

  try {
    const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);

    await client.sendEmail({
      From: process.env.POSTMARK_FROM_EMAIL || "noreply@muskingummaterials.com",
      To: "sales@muskingummaterials.com",
      Subject: `Order ${data.orderNumber} - ${data.status.toUpperCase()} - Internal Notification`,
      TextBody: `
${message}

${formatOrderSummary(data)}

Status: ${data.status}
${data.statusNotes ? `\nStatus Notes: ${data.statusNotes}` : ""}
      `.trim(),
      ReplyTo: data.customerEmail,
    });

    console.log(`Internal notification sent for order ${data.orderNumber}`);
  } catch (error) {
    console.error(`Failed to send internal notification for ${data.orderNumber}:`, error);
    // Don't throw - internal notifications are not critical
  }
}
