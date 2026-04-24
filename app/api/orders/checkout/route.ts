import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/schemas";
import { validateCheckoutPrices } from "@/lib/validate-checkout-prices";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { addBreadcrumb, startTransaction } from "@/lib/monitoring";

function generateOrderNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const randomPart = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
  return `MM-${datePart}-${randomPart}`;
}

export async function POST(request: NextRequest) {
  return startTransaction('checkout', 'http.request', () => {
    return handleCheckout(request);
  });
}

async function handleCheckout(request: NextRequest) {
  try {
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    logger.info('Checkout started', {
      itemCount: data.items.length,
      fulfillment: data.fulfillment,
      email: data.email,
    });

    addBreadcrumb('Checkout request received', 'checkout', {
      itemCount: data.items.length,
      fulfillment: data.fulfillment,
    });

    // Get authenticated user if available
    let userId: string | null = null;
    let contractorDiscount: number | undefined;
    try {
      const session = await auth();
      userId = session?.userId ?? null;

      // Fetch contractor status and discount if authenticated
      if (userId) {
        const profile = await prisma.userProfile.findUnique({
          where: { userId },
          select: { isContractor: true, contractorDiscount: true },
        });

        if (profile?.isContractor && profile.contractorDiscount) {
          contractorDiscount = profile.contractorDiscount;
        }
      }
    } catch {
      // Not authenticated - that's fine for guest checkout
    }

    // Validate prices against product catalog
    let validatedPrices;
    try {
      validatedPrices = await validateCheckoutPrices(data, contractorDiscount);

      addBreadcrumb('Price validation successful', 'checkout', {
        subtotal: validatedPrices.subtotal,
        total: validatedPrices.total,
      });
    } catch (validationError) {
      const errorMessage = validationError instanceof Error
        ? validationError.message
        : "Price validation failed";

      logger.warn('Price validation failed', {
        error: errorMessage,
        itemCount: data.items.length,
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();

    // Create order in database
    let order;
    try {
      order = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          items: data.items,
          subtotal: validatedPrices.subtotal,
          tax: validatedPrices.tax,
          processingFee: validatedPrices.processingFee,
          total: validatedPrices.total,
          pickupOrDeliver: data.fulfillment,
          deliveryAddress: data.deliveryAddress || null,
          deliveryNotes: data.deliveryNotes || null,
          smsOptIn: data.smsOptIn || false,
          status: "pending",
          paymentStatus: "unpaid",
        },
      });

      logger.info('Order created successfully', {
        orderNumber,
        userId,
        total: validatedPrices.total,
        fulfillment: data.fulfillment,
        itemCount: data.items.length,
      });

      addBreadcrumb('Order created in database', 'database', {
        orderNumber,
        orderId: order.id,
      });
    } catch (error) {
      logger.error('Order creation failed', error, {
        orderNumber,
        userId,
        email: data.email,
        total: validatedPrices.total,
      });

      return NextResponse.json(
        { error: "Failed to create order. Please try again or call (740) 319-0183." },
        { status: 500 }
      );
    }

    // Try Stripe Checkout Session
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = (await import("stripe")).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);

        const lineItems = data.items.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              description: `${item.quantity} ${item.unit}${item.quantity !== 1 ? "s" : ""} of ${item.name}`,
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        }));

        // Add tax line
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: "Ohio Sales Tax (7.25%)",
              description: "State sales tax",
            },
            unit_amount: Math.round(validatedPrices.tax * 100),
          },
          quantity: 1,
        });

        // Add processing fee line
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: "Credit Card Processing Fee (4.5%)",
              description: "Card processing fee",
            },
            unit_amount: Math.round(validatedPrices.processingFee * 100),
          },
          quantity: 1,
        });

        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: lineItems,
          mode: "payment",
          success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/order/success?order=${orderNumber}`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/order?canceled=true`,
          customer_email: data.email,
          metadata: {
            orderNumber,
            customerName: data.name,
            customerPhone: data.phone,
            fulfillment: data.fulfillment,
          },
        });

        logger.info('Stripe checkout session created', {
          orderNumber,
          sessionId: session.id,
          total: validatedPrices.total,
        });

        addBreadcrumb('Stripe session created', 'payment', {
          orderNumber,
          sessionId: session.id,
        });

        // Update order with Stripe session ID
        if (order) {
          try {
            await prisma.order.update({
              where: { id: order.id },
              data: { stripeSessionId: session.id },
            });

            addBreadcrumb('Order updated with Stripe session ID', 'database', {
              orderId: order.id,
              sessionId: session.id,
            });
          } catch (error) {
            logger.error('Failed to update order with Stripe session ID', error, {
              orderId: order.id,
              orderNumber,
              sessionId: session.id,
            });
            // Continue anyway - Stripe session was created successfully
          }
        }

        return NextResponse.json({ url: session.url });
      } catch (stripeError) {
        logger.error('Stripe checkout session creation failed', stripeError, {
          orderNumber,
          total: validatedPrices.total,
          email: data.email,
        });
        // Fall through to non-Stripe flow
      }
    }

    // Non-Stripe fallback: just save the order
    logger.info('Using non-Stripe checkout flow', {
      orderNumber,
      reason: process.env.STRIPE_SECRET_KEY ? 'stripe_error' : 'stripe_not_configured',
    });

    // Send email notification
    const itemsList = data.items
      .map((i) => `  - ${i.name}: ${i.quantity} ${i.unit}(s) @ $${i.price.toFixed(2)} = $${(i.price * i.quantity).toFixed(2)}`)
      .join("\n");

    await sendEmail({
      to: "sales@muskingummaterials.com",
      subject: `New Online Order ${orderNumber} from ${data.name}`,
      textBody: `
New online order received!

Order #: ${orderNumber}
Customer: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Fulfillment: ${data.fulfillment === "pickup" ? "Pickup at yard" : "Delivery"}
${data.deliveryAddress ? `Delivery Address: ${data.deliveryAddress}` : ""}
${data.deliveryNotes ? `Notes: ${data.deliveryNotes}` : ""}

Items:
${itemsList}

Subtotal: $${validatedPrices.subtotal.toFixed(2)}
Tax (7.25%): $${validatedPrices.tax.toFixed(2)}
Processing Fee (4.5%): $${validatedPrices.processingFee.toFixed(2)}
Total: $${validatedPrices.total.toFixed(2)}

Payment: Pending — Stripe not configured, customer will pay on pickup/delivery.
      `.trim(),
      replyTo: data.email,
    });

    logger.info('Order notification email sent', {
      orderNumber,
      recipient: 'sales@muskingummaterials.com',
    });

    addBreadcrumb('Email notification sent', 'email', {
      orderNumber,
    });

    logger.info('Checkout completed successfully', {
      orderNumber,
      total: validatedPrices.total,
      paymentMethod: 'pay_on_pickup',
    });

    return NextResponse.json({ orderNumber });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid checkout data received', {
        errors: error.errors,
      });

      return NextResponse.json(
        { error: "Invalid order data", details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Checkout failed with unexpected error', error, {
      email: (error as { email?: string })?.email,
    });

    return NextResponse.json(
      { error: "Checkout failed. Please call (740) 319-0183." },
      { status: 500 }
    );
  }
}
