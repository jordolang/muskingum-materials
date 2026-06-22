import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const payInvoiceSchema = z.object({
  savedPaymentMethodId: z.string().min(1, "Payment method ID is required"),
});

/**
 * POST /api/account/invoices/[id]/pay
 * Pay an invoice using a saved payment method
 *
 * Auth: Requires Clerk authentication
 * Request body: { savedPaymentMethodId: string }
 * Returns: { invoice: Invoice, paymentIntentId: string }
 *
 * Flow:
 * 1. Verify invoice belongs to user and is unpaid
 * 2. Verify saved payment method belongs to user
 * 3. Create Stripe PaymentIntent with saved payment method
 * 4. Update invoice status to "paid" and set paidAt
 * 5. Update user's net terms balance
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: invoiceId } = await params;
    const body = await request.json();
    const { savedPaymentMethodId } = payInvoiceSchema.parse(body);

    // Fetch invoice with order details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        order: {
          select: {
            id: true,
            userId: true,
            orderNumber: true,
            total: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Verify invoice belongs to user
    if (invoice.order.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if invoice is already paid
    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Invoice already paid" },
        { status: 400 }
      );
    }

    // Verify saved payment method belongs to user
    const savedPaymentMethod = await prisma.savedPaymentMethod.findFirst({
      where: {
        id: savedPaymentMethodId,
        userId: session.userId,
      },
    });

    if (!savedPaymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    // Process payment with Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error("Stripe not configured", new Error("STRIPE_SECRET_KEY missing"));
      return NextResponse.json(
        { error: "Payment processing not available" },
        { status: 501 }
      );
    }

    const stripe = (await import("stripe")).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);

    // Create PaymentIntent with saved payment method
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(invoice.amount * 100), // Convert to cents
      currency: "usd",
      payment_method: savedPaymentMethod.stripePaymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        orderId: invoice.order.id,
        orderNumber: invoice.order.orderNumber,
        userId: session.userId,
      },
      description: `Payment for invoice ${invoice.invoiceNumber} (Order ${invoice.order.orderNumber})`,
    });

    if (paymentIntent.status !== "succeeded") {
      logger.error("Payment failed", new Error("PaymentIntent not succeeded"), {
        userId: session.userId,
        invoiceId: invoice.id,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      });
      return NextResponse.json(
        { error: "Payment failed. Please try a different payment method." },
        { status: 400 }
      );
    }

    // Update invoice and user profile in a transaction
    const [updatedInvoice] = await prisma.$transaction([
      // Update invoice status
      prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "paid",
          paidAt: new Date(),
          notes: invoice.notes
            ? `${invoice.notes}\nPaid via ${savedPaymentMethod.brand} ****${savedPaymentMethod.last4} (${paymentIntent.id})`
            : `Paid via ${savedPaymentMethod.brand} ****${savedPaymentMethod.last4} (${paymentIntent.id})`,
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              createdAt: true,
            },
          },
        },
      }),
      // Update order payment status
      prisma.order.update({
        where: { id: invoice.order.id },
        data: {
          paymentStatus: "paid",
          stripePaymentId: paymentIntent.id,
        },
      }),
      // Update user's net terms balance (reduce by invoice amount)
      prisma.userProfile.updateMany({
        where: { userId: session.userId },
        data: {
          netTermsBalance: {
            decrement: invoice.amount,
          },
        },
      }),
    ]);

    logger.info("Invoice paid successfully", {
      userId: session.userId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      paymentIntentId: paymentIntent.id,
    });

    return NextResponse.json({
      invoice: updatedInvoice,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invoice payment validation failed", {
        userId: session?.userId,
        errors: error.errors,
      });
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    // Handle Stripe errors
    if (error && typeof error === "object" && "type" in error) {
      const stripeError = error as { type: string; message?: string };
      logger.error("Stripe payment error", error, {
        userId: session?.userId,
        errorType: stripeError.type,
      });
      return NextResponse.json(
        {
          error: stripeError.message || "Payment processing failed",
        },
        { status: 400 }
      );
    }

    logger.error("Failed to pay invoice", error, {
      userId: session?.userId,
    });
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
