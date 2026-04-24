import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePointsForAmount } from "@/lib/loyalty";
import { logger } from "@/lib/logger";
import { addBreadcrumb } from "@/lib/monitoring";
import * as Sentry from "@sentry/nextjs";

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
          // Update order status
          const order = await prisma.order.update({
            where: { orderNumber },
            data: {
              paymentStatus: "paid",
              status: "confirmed",
              stripePaymentId: session.payment_intent as string,
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

            // Find or create loyalty account
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

            // Create transaction and update points
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
