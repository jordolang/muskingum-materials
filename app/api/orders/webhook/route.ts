import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";

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
          const order = await prisma.order.update({
            where: { orderNumber },
            data: {
              paymentStatus: "paid",
              status: "confirmed",
              stripePaymentId: session.payment_intent as string,
            },
          });

          // Send SMS notification if customer opted in
          if (order.smsOptIn && order.phone) {
            const message = `Your order #${order.orderNumber} has been confirmed! Track your order at ${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.orderNumber}`;

            const result = await sendSMS({
              to: order.phone,
              message,
            });

            // Create SMS notification record
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
