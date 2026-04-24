import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePointsForAmount } from "@/lib/loyalty";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 501 });
  }

  const stripe = (await import("stripe")).default;
  const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  try {
    const event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

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
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }
}
