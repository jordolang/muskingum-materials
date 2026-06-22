import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";
import { calculatePointsForAmount } from "@/lib/loyalty";
import { logger } from "@/lib/logger";
import { addBreadcrumb } from "@/lib/monitoring";
import * as Sentry from "@sentry/nextjs";

/**
 * Stripe webhook endpoint for payment and order status updates.
 *
 * @access public
 * @param request - Incoming webhook request from Stripe. Body is raw text verified
 *   against the `stripe-signature` header using `STRIPE_WEBHOOK_SECRET` to prevent
 *   tampering. No body schema validation — event structure is verified by Stripe SDK.
 * @returns 200 `{ received: true }` on successful webhook processing
 * @returns 400 `{ error: "No signature" }` when `stripe-signature` header is missing
 * @returns 400 `{ error: "Webhook verification failed" }` when signature validation fails
 * @returns 501 `{ error: "Not configured" }` when `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` env vars are missing
 * @see https://stripe.com/docs/webhooks/signatures — webhook signature verification
 * @see app/api/orders/checkout/route.ts — creates checkout sessions with orderNumber metadata
 * @remarks Event types handled:
 *   - `checkout.session.completed`: Confirms payment, updates order to paid/confirmed,
 *     retrieves Stripe receipt URL, awards loyalty points for logged-in customers,
 *     and sends SMS notifications for opted-in customers
 *   - `checkout.session.expired`: Marks order as expired/canceled, logs payment failure to Sentry
 *   - `order.completed` (custom event): Marks order as completed with timestamp
 *
 *   Security: Validates Stripe webhook signature using `STRIPE_WEBHOOK_SECRET` before
 *   processing. Rejects requests without valid signature (400 Bad Request). Uses secure
 *   `webhooks.constructEvent()` to prevent tampering. All webhook events and failures
 *   are logged for audit trail via logger and Sentry breadcrumbs.
 */
export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    logger.error(
      "Stripe webhook configuration missing",
      new Error("STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not configured")
    );
    return NextResponse.json({ error: "Not configured" }, { status: 501 });
  }

  const stripe = (await import("stripe")).default;
  const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    logger.warn("Stripe webhook received without signature");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  try {
    const event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    logger.info("Stripe webhook received", {
      eventType: event.type,
      eventId: event.id,
      timestamp: new Date().toISOString(),
    });

    addBreadcrumb("Stripe webhook received", "payment", {
      eventType: event.type,
      eventId: event.id,
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderNumber = session.metadata?.orderNumber;

        if (orderNumber) {
          // Fetch Stripe receipt URL from the payment intent charges
          let receiptUrl: string | null = null;
          try {
            if (session.payment_intent) {
              const paymentIntent = await stripeClient.paymentIntents.retrieve(
                session.payment_intent as string,
                { expand: ["latest_charge"] }
              );
              const charge = paymentIntent.latest_charge as import("stripe").Stripe.Charge | null;
              receiptUrl = charge?.receipt_url ?? null;
            }
          } catch (receiptErr) {
            logger.warn("Could not retrieve Stripe receipt URL", {
              orderNumber,
              error: receiptErr instanceof Error ? receiptErr.message : String(receiptErr),
            });
          }

          // Update order status
          const order = await prisma.order.update({
            where: { orderNumber },
            data: {
              paymentStatus: "paid",
              status: "confirmed",
              stripePaymentId: session.payment_intent as string,
              invoiceUrl: receiptUrl,
            },
          });

          logger.info("Payment completed successfully", {
            orderNumber,
            eventType: event.type,
            paymentIntentId: session.payment_intent as string,
            timestamp: new Date().toISOString(),
          });

          addBreadcrumb("Payment completed", "payment", {
            orderNumber,
            paymentIntentId: session.payment_intent as string,
          });

          // Award loyalty points if customer is logged in
          if (order.userId) {
            const pointsEarned = calculatePointsForAmount(order.total);

            let loyaltyAccount = await prisma.loyaltyAccount.findUnique({
              where: { userId: order.userId },
            });

            if (!loyaltyAccount) {
              loyaltyAccount = await prisma.loyaltyAccount.create({
                data: {
                  userId: order.userId,
                  points: 0,
                  pointsLifetime: 0,
                  tier: "bronze",
                },
              });
            }

            await prisma.$transaction([
              prisma.loyaltyTransaction.create({
                data: {
                  accountId: loyaltyAccount.id,
                  type: "earned",
                  points: pointsEarned,
                  orderId: order.id,
                  description: `Points earned from order ${orderNumber}`,
                },
              }),
              prisma.loyaltyAccount.update({
                where: { id: loyaltyAccount.id },
                data: {
                  points: { increment: pointsEarned },
                  pointsLifetime: { increment: pointsEarned },
                },
              }),
            ]);
          }

          // Send SMS notification if customer opted in
          if (order.smsOptIn && order.phone) {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
            const message = `Your order #${order.orderNumber} has been confirmed! Track your order at ${baseUrl}/account/orders/${order.orderNumber}`;

            const result = await sendSMS({
              to: order.phone,
              message,
            });

            await prisma.smsNotification.create({
              data: {
                orderId: order.id,
                type: "order_confirmed",
                phone: order.phone,
                message,
                status: result.success ? "sent" : "failed",
                providerId: result.messageId,
                errorMsg: result.error,
                sentAt: result.success ? new Date() : null,
              },
            });
          }
        } else {
          logger.warn("Payment completed but no orderNumber in metadata", {
            eventType: event.type,
            sessionId: session.id,
            timestamp: new Date().toISOString(),
          });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const orderNumber = session.metadata?.orderNumber;

        if (orderNumber) {
          await prisma.order.update({
            where: { orderNumber },
            data: {
              paymentStatus: "expired",
              status: "canceled",
            },
          });

          // Log payment failure with alert tagging
          logger.warn("Payment session expired", {
            orderNumber,
            eventType: event.type,
            sessionId: session.id,
            timestamp: new Date().toISOString(),
          });

          // Tag for Sentry alert configuration
          Sentry.setTag("error_type", "payment_failure");
          Sentry.captureMessage(
            `Payment session expired for order ${orderNumber}`,
            "warning"
          );

          addBreadcrumb("Payment session expired", "payment", {
            orderNumber,
            sessionId: session.id,
          });
        } else {
          logger.warn("Payment session expired but no orderNumber in metadata", {
            eventType: event.type,
            sessionId: session.id,
            timestamp: new Date().toISOString(),
          });
        }
        break;
      }

      default: {
        // Handle custom events (not in Stripe's official type definitions)
        const customEvent = event as { type?: string; data?: { object?: { orderNumber?: string } } };
        if (customEvent.type === "order.completed") {
          const data = customEvent.data?.object as { orderNumber?: string } | undefined;
          const orderNumber = data?.orderNumber;

          if (orderNumber) {
            await prisma.order.update({
              where: { orderNumber },
              data: {
                status: "completed",
                completedAt: new Date(),
              },
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Stripe webhook verification failed", error, {
      route: "/api/orders/webhook",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }
}
