import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema, type CheckoutData } from "@/lib/schemas";

function generateOrderNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const randomPart = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
  return `MM-${datePart}-${randomPart}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = checkoutSchema.parse(body);
    const orderNumber = generateOrderNumber();

    // Get authenticated user if available
    let userId: string | null = null;
    try {
      const session = await auth();
      userId = session?.userId ?? null;
    } catch {
      // Not authenticated - that's fine for guest checkout
    }

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
          subtotal: data.subtotal,
          tax: data.tax,
          processingFee: data.processingFee,
          total: data.total,
          pickupOrDeliver: data.fulfillment,
          deliveryAddress: data.deliveryAddress || null,
          deliveryNotes: data.deliveryNotes || null,
          status: "pending",
          paymentStatus: "unpaid",
        },
      });
    } catch {
      // Database might not be configured
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
            unit_amount: Math.round(data.tax * 100),
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
            unit_amount: Math.round(data.processingFee * 100),
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

        // Update order with Stripe session ID
        if (order) {
          try {
            await prisma.order.update({
              where: { id: order.id },
              data: { stripeSessionId: session.id },
            });
          } catch {
            // Ignore update failure
          }
        }

        return NextResponse.json({
          url: session.url,
          analytics: {
            orderNumber,
            subtotal: data.subtotal,
            tax: data.tax,
            total: data.total,
            items: data.items.map((item) => ({
              id: item.name.toLowerCase().replace(/\s+/g, "-"),
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
          },
        });
      } catch (stripeError) {
        console.error("Stripe error:", stripeError);
        // Fall through to non-Stripe flow
      }
    }

    // Non-Stripe fallback: just save the order
    // Send email notification
    if (process.env.POSTMARK_API_TOKEN) {
      try {
        const postmark = await import("postmark");
        const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);
        const itemsList = data.items
          .map((i) => `  - ${i.name}: ${i.quantity} ${i.unit}(s) @ $${i.price.toFixed(2)} = $${(i.price * i.quantity).toFixed(2)}`)
          .join("\n");

        await client.sendEmail({
          From: process.env.POSTMARK_FROM_EMAIL || "noreply@muskingummaterials.com",
          To: "sales@muskingummaterials.com",
          Subject: `New Online Order ${orderNumber} from ${data.name}`,
          TextBody: `
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

Subtotal: $${data.subtotal.toFixed(2)}
Tax (7.25%): $${data.tax.toFixed(2)}
Processing Fee (4.5%): $${data.processingFee.toFixed(2)}
Total: $${data.total.toFixed(2)}

Payment: Pending — Stripe not configured, customer will pay on pickup/delivery.
          `.trim(),
          ReplyTo: data.email,
        });
      } catch (emailError) {
        console.error("Email error:", emailError);
      }
    }

    return NextResponse.json({
      orderNumber,
      analytics: {
        orderNumber,
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
        items: data.items.map((item) => ({
          id: item.name.toLowerCase().replace(/\s+/g, "-"),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid order data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Checkout failed. Please call (740) 319-0183." },
      { status: 500 }
    );
  }
}
