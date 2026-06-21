import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email-service";
import { logger } from "@/lib/logger";

const refundSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(1).max(500),
});

/**
 * POST /api/admin/orders/[id]/refund
 * Admin endpoint - processes full or partial refund via Stripe
 * Requires: Admin authentication via requireAdmin()
 * Body: { amount, reason }
 * Validates: Order exists, is paid, has Stripe payment ID, amount <= total
 * Creates Stripe refund, updates order paymentStatus (refunded or partially_refunded)
 * Records status history and sends email notification to customer
 * Returns: { success, refundId, newPaymentStatus }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = refundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.errors }, { status: 400 });
  }

  const { amount, reason } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.paymentStatus !== "paid") {
    return NextResponse.json({ error: "Order is not in a paid state" }, { status: 400 });
  }

  if (!order.stripePaymentId) {
    return NextResponse.json(
      { error: "No Stripe payment ID on record — refund manually via Stripe Dashboard" },
      { status: 400 }
    );
  }

  if (amount > order.total) {
    return NextResponse.json({ error: "Refund amount exceeds order total" }, { status: 400 });
  }

  const isFullRefund = Math.abs(amount - order.total) < 0.01;

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured — refund manually via Stripe Dashboard" },
      { status: 400 }
    );
  }

  let refund;
  try {
    const stripe = (await import("stripe")).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);

    refund = await stripeClient.refunds.create({
      payment_intent: order.stripePaymentId,
      amount: Math.round(amount * 100),
    });

    logger.info("Stripe refund created", {
      orderId: id,
      orderNumber: order.orderNumber,
      refundId: refund.id,
      amount,
      isFullRefund,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe refund failed";
    logger.error("Stripe refund failed", err, { orderId: id, amount });
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const newPaymentStatus = isFullRefund ? "refunded" : "partially_refunded";

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: {
        paymentStatus: newPaymentStatus,
        status: isFullRefund ? "canceled" : order.status,
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: newPaymentStatus,
        notes: `${isFullRefund ? "Full" : "Partial"} refund of $${amount.toFixed(2)} issued. Reason: ${reason}. Stripe refund ID: ${refund.id}`,
        changedBy: "admin",
      },
    }),
  ]);

  await sendEmail({
    to: order.email,
    subject: `Refund issued for order ${order.orderNumber}`,
    textBody: `
Hi ${order.name},

${isFullRefund ? "A full refund" : `A partial refund of $${amount.toFixed(2)}`} has been issued for your order ${order.orderNumber}.

Refund amount: $${amount.toFixed(2)}
Reason: ${reason}

The refund will appear on your original payment method within 5–10 business days depending on your bank.

If you have any questions, please contact us at (740) 319-0183 or sales@muskingummaterials.com.

Thank you,
Muskingum Materials
    `.trim(),
    htmlBody: `
<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#1f2937">Refund Issued</h2>
<p>Hi ${order.name},</p>
<p>${isFullRefund ? "A full refund has been issued" : `A partial refund of <strong>$${amount.toFixed(2)}</strong> has been issued`} for your order <strong>${order.orderNumber}</strong>.</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0">
  <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280">Refund amount</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600">$${amount.toFixed(2)}</td></tr>
  <tr><td style="padding:8px;color:#6b7280">Reason</td><td style="padding:8px">${reason}</td></tr>
</table>
<p>The refund will appear on your original payment method within <strong>5–10 business days</strong> depending on your bank.</p>
<p style="color:#6b7280;font-size:13px">Questions? Call <a href="tel:7403190183">(740) 319-0183</a> or email <a href="mailto:sales@muskingummaterials.com">sales@muskingummaterials.com</a>.</p>
</body></html>
    `.trim(),
  });

  return NextResponse.json({ success: true, refundId: refund.id, newPaymentStatus });
}
