import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendSimpleEmail } from "@/lib/email-service";
import { logger } from "@/lib/logger";
import { BUSINESS_INFO } from "@/data/business";

const phoneOrderItemSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),
});

const phoneOrderSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(1).max(50),
  items: z.array(phoneOrderItemSchema).min(1),
  fulfillment: z.enum(["pickup", "delivery"]),
  deliveryAddress: z.string().optional(),
  deliveryNotes: z.string().optional(),
  notes: z.string().optional(),
});

function generateOrderNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const randomPart = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
  return `MM-${datePart}-${randomPart}`;
}

/**
 * POST /api/admin/orders/phone
 * Admin endpoint - creates an order from a phone call
 * Requires: Admin authentication via requireAdmin()
 * Body: { name, email, phone, items[], fulfillment, deliveryAddress?, deliveryNotes?, notes? }
 * Creates order with "confirmed" status and "unpaid" payment status
 * Sends email notification to sales@muskingummaterials.com
 * Returns: { orderNumber, orderId }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = phoneOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.errors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * BUSINESS_INFO.taxRate;
  const total = subtotal + tax;
  const orderNumber = generateOrderNumber();

  let order;
  try {
    order = await prisma.order.create({
      data: {
        orderNumber,
        name: data.name,
        email: data.email,
        phone: data.phone,
        items: data.items,
        subtotal,
        tax,
        processingFee: 0,
        total,
        pickupOrDeliver: data.fulfillment,
        deliveryAddress: data.deliveryAddress || null,
        deliveryNotes: data.deliveryNotes || null,
        smsOptIn: false,
        termsAcceptedAt: null,
        status: "confirmed",
        paymentStatus: "unpaid",
      },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "confirmed",
        notes: `Phone order entered by staff.${data.notes ? ` Notes: ${data.notes}` : ""}`,
        changedBy: "admin",
      },
    });

    logger.info("Phone order created", {
      orderNumber,
      total,
      fulfillment: data.fulfillment,
      itemCount: data.items.length,
    });
  } catch (err) {
    logger.error("Phone order creation failed", err, { orderNumber });
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }

  const itemsList = data.items
    .map((i) => `  - ${i.name}: ${i.quantity} ${i.unit}(s) @ $${i.price.toFixed(2)} = $${(i.price * i.quantity).toFixed(2)}`)
    .join("\n");

  await sendSimpleEmail({
    to: "sales@muskingummaterials.com",
    subject: `Phone Order ${orderNumber} — ${data.name}`,
    textBody: `
Phone order entered by staff.

Order #: ${orderNumber}
Customer: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Fulfillment: ${data.fulfillment === "pickup" ? "Pickup at yard" : "Delivery"}
${data.deliveryAddress ? `Delivery address: ${data.deliveryAddress}` : ""}
${data.deliveryNotes ? `Delivery notes: ${data.deliveryNotes}` : ""}
${data.notes ? `Staff notes: ${data.notes}` : ""}

Items:
${itemsList}

Subtotal: $${subtotal.toFixed(2)}
Tax (${(BUSINESS_INFO.taxRate * 100).toFixed(2)}%): $${tax.toFixed(2)}
Total: $${total.toFixed(2)}

Payment: To be collected (cash/check) on pickup or delivery.
    `.trim(),
    htmlBody: `
<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:24px">
<h2>Phone Order — Staff Entry</h2>
<p><strong>Order #:</strong> ${orderNumber}<br>
<strong>Customer:</strong> ${data.name}<br>
<strong>Email:</strong> ${data.email}<br>
<strong>Phone:</strong> ${data.phone}<br>
<strong>Fulfillment:</strong> ${data.fulfillment === "pickup" ? "Pickup at yard" : "Delivery"}</p>
${data.deliveryAddress ? `<p><strong>Delivery Address:</strong><br>${data.deliveryAddress}</p>` : ""}
${data.deliveryNotes ? `<p><strong>Delivery Notes:</strong> ${data.deliveryNotes}</p>` : ""}
${data.notes ? `<p><strong>Staff Notes:</strong> ${data.notes}</p>` : ""}
<h3>Items</h3>
<pre style="font-family:ui-monospace,Menlo,monospace;background:#f9fafb;padding:12px;border-radius:8px">${itemsList}</pre>
<p>
Subtotal: $${subtotal.toFixed(2)}<br>
Tax (${(BUSINESS_INFO.taxRate * 100).toFixed(2)}%): $${tax.toFixed(2)}<br>
<strong>Total: $${total.toFixed(2)}</strong>
</p>
<p style="color:#6b7280;font-size:12px">Payment: To be collected (cash/check) on pickup or delivery.</p>
</body></html>
    `.trim(),
    replyTo: data.email,
  });

  return NextResponse.json({ orderNumber, orderId: order.id });
}
