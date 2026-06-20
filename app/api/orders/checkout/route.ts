import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/schemas";
import { validateCheckoutPrices } from "@/lib/validate-checkout-prices";
import { validateCreditLimit } from "@/lib/validate-credit-limit";
import { generateInvoice } from "@/lib/generate-invoice";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { addBreadcrumb, startTransaction } from "@/lib/monitoring";
import { buildSatelliteMapUrl } from "@/lib/static-map";
import { ORDER_NUMBER_PREFIX } from "@/lib/constants/business-rules";

/**
 * Generates a unique order number for a new order.
 *
 * Order number format: `{ORDER_NUMBER_PREFIX}-YYMMDD-XXXXXXXX`
 * - `ORDER_NUMBER_PREFIX`: Company identifier (from business-rules.ts)
 * - `YYMMDD`: Date in YYMMDD format with no dashes (e.g., "260526" for May 26, 2026)
 * - `XXXXXXXX`: 8-character uppercase hexadecimal random identifier
 *
 * Example: `MM-260526-A1B2C3D4`
 *
 * The date component provides chronological sorting and human readability,
 * while the random component ensures uniqueness and prevents collisions
 * for orders created at the same time.
 *
 * @returns A unique order number string
 */
function generateOrderNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const randomPart = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
  return `${ORDER_NUMBER_PREFIX}-${datePart}-${randomPart}`;
}

/**
 * Checkout endpoint for processing customer orders with Stripe payment integration
 * Handles:
 * - checkoutSchema validation (name, email, phone, items, fulfillment, project site data)
 * - Order number generation in format MM-YYMMDD-XXXXXXXX
 * - Authenticated user detection and contractor discount application
 * - Price validation against product catalog (prevents client-side price manipulation)
 * - Project site data capture with satellite map URL generation for estimator-drawn polygons
 * - Database order creation with full project details and calculated totals
 * - Stripe Checkout Session creation with line items for products, tax, and processing fee
 * - Email notification to sales@muskingummaterials.com with order details and site map
 * - Fallback to pay-on-pickup flow when Stripe is not configured
 */
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

    // Build a Static Maps satellite snapshot URL from the project-site data
    // the customer captured in the estimator. This URL is what the order
    // confirmation page, the admin order detail page, the printable
    // receipt, and the email to Muskingum Materials all render.
    const site = data.projectSite ?? null;
    const projectMapImageUrl = site?.location || (site?.polygons?.length ?? 0) > 0
      ? buildSatelliteMapUrl({
          center: site?.location ?? null,
          zoom: site?.polygons && site.polygons.length > 0 ? undefined : 19,
          polygons: site?.polygons ?? [],
        })
      : null;

    // Determine payment method - map from schema to Prisma enum
    const paymentMethodMap = {
      stripe: "CARD" as const,
      purchase_order: "PURCHASE_ORDER" as const,
      net_terms: "NET_TERMS" as const,
      saved_payment_method: "SAVED_PAYMENT_METHOD" as const,
    };
    type PaymentMethodKey = keyof typeof paymentMethodMap;
    const paymentMethod = paymentMethodMap[(data.paymentMethod || "stripe") as PaymentMethodKey] || ("CARD" as const);

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
          termsAcceptedAt: data.termsAccepted ? new Date() : null,
          status: "pending",
          paymentStatus: "unpaid",
          paymentMethod,
          poNumber: data.purchaseOrderNumber || null,
          savedPaymentMethodId: data.savedPaymentMethodId || null,
          projectAddress: site?.address || null,
          projectLat: site?.location?.lat ?? null,
          projectLng: site?.location?.lng ?? null,
          projectAreaSqFt: site?.totalAreaSqFt ?? null,
          projectDepthInches: site?.depthInches ?? null,
          projectEstimateTons: site?.estimate?.tons ?? null,
          projectEstimateCubicYards: site?.estimate?.cubicYards ?? null,
          projectEstimateSource: site?.mode ?? null,
          projectPolygons: site?.polygons?.length ? site.polygons : undefined,
          projectMapImageUrl,
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

    // Handle payment method-specific flows
    const requestedPaymentMethod = data.paymentMethod || "stripe";

    // PURCHASE ORDER: Skip Stripe, record PO number, send email notification
    if (requestedPaymentMethod === "purchase_order") {
      logger.info('Purchase order payment method selected', {
        orderNumber,
        poNumber: data.purchaseOrderNumber,
        userId,
      });

      addBreadcrumb('Purchase order flow', 'checkout', {
        orderNumber,
        poNumber: data.purchaseOrderNumber,
      });

      // Send email notification for PO order
      await sendPurchaseOrderEmail(data, order, validatedPrices, site, projectMapImageUrl);

      logger.info('Checkout completed successfully with purchase order', {
        orderNumber,
        total: validatedPrices.total,
        paymentMethod: 'purchase_order',
        poNumber: data.purchaseOrderNumber,
      });

      return NextResponse.json({
        orderNumber,
        paymentMethod: 'purchase_order',
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
    }

    // NET TERMS: Validate credit limit, create invoice, update balance
    if (requestedPaymentMethod === "net_terms") {
      if (!userId) {
        logger.warn('Net terms requested without authentication', {
          orderNumber,
          email: data.email,
        });

        return NextResponse.json(
          { error: "You must be logged in to use net terms payment" },
          { status: 401 }
        );
      }

      // Validate credit limit
      const creditValidation = await validateCreditLimit(userId, validatedPrices.total);
      if (!creditValidation.allowed) {
        logger.warn('Net terms credit limit validation failed', {
          orderNumber,
          userId,
          total: validatedPrices.total,
          errorMessage: creditValidation.errorMessage,
        });

        return NextResponse.json(
          { error: creditValidation.errorMessage || "Credit limit exceeded" },
          { status: 400 }
        );
      }

      // Fetch contractor's net terms length
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { netTermsLength: true },
      });

      if (!profile?.netTermsLength) {
        logger.error('Net terms length not found for approved contractor', {
          orderNumber,
          userId,
        });

        return NextResponse.json(
          { error: "Net terms configuration error. Please contact support." },
          { status: 500 }
        );
      }

      // Create invoice
      let invoice;
      try {
        invoice = await generateInvoice({
          orderId: order.id,
          amount: validatedPrices.total,
          netTermsLength: profile.netTermsLength,
          notes: `Net ${profile.netTermsLength} terms for order ${orderNumber}`,
        });

        // Update order with due date
        await prisma.order.update({
          where: { id: order.id },
          data: { dueDate: invoice.dueDate },
        });

        // Update contractor's net terms balance
        await prisma.userProfile.update({
          where: { userId },
          data: {
            netTermsBalance: {
              increment: validatedPrices.total,
            },
          },
        });

        logger.info('Invoice created for net terms order', {
          orderNumber,
          invoiceNumber: invoice.invoiceNumber,
          dueDate: invoice.dueDate,
          amount: validatedPrices.total,
        });

        addBreadcrumb('Invoice created', 'database', {
          orderNumber,
          invoiceNumber: invoice.invoiceNumber,
        });
      } catch (invoiceError) {
        logger.error('Failed to create invoice for net terms order', invoiceError, {
          orderNumber,
          userId,
          total: validatedPrices.total,
        });

        return NextResponse.json(
          { error: "Failed to create invoice. Please contact support." },
          { status: 500 }
        );
      }

      // Send email notification for net terms order
      await sendNetTermsEmail(data, order, invoice, validatedPrices, site, projectMapImageUrl);

      logger.info('Checkout completed successfully with net terms', {
        orderNumber,
        invoiceNumber: invoice.invoiceNumber,
        total: validatedPrices.total,
        paymentMethod: 'net_terms',
        dueDate: invoice.dueDate,
      });

      return NextResponse.json({
        orderNumber,
        invoiceNumber: invoice.invoiceNumber,
        dueDate: invoice.dueDate,
        paymentMethod: 'net_terms',
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
    }

    // SAVED PAYMENT METHOD: Charge the saved card via Stripe PaymentIntent
    if (requestedPaymentMethod === "saved_payment_method") {
      // TODO: Implement saved payment method charging in subtask-4-4
      // This will use Stripe PaymentIntents.create with payment_method
      logger.warn('Saved payment method not yet implemented', {
        orderNumber,
        userId,
      });

      return NextResponse.json(
        { error: "Saved payment method checkout is not yet available. Please use card payment." },
        { status: 501 }
      );
    }

    // STRIPE CHECKOUT (default): Create Stripe Checkout Session
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

    const siteSummaryLines: string[] = [];
    if (site) {
      if (site.address) {
        siteSummaryLines.push(`Project address: ${site.address}`);
      }
      if (site.estimate) {
        siteSummaryLines.push(
          `Estimate: ${site.estimate.tons.toFixed(1)} tons (${site.estimate.cubicYards.toFixed(1)} cu yd) over ${site.totalAreaSqFt?.toFixed(0) ?? "?"} sq ft @ ${site.depthInches ?? "?"}" depth — source: ${site.mode}`,
        );
      }
      if (projectMapImageUrl) {
        siteSummaryLines.push(`Satellite outline: ${projectMapImageUrl}`);
      }
    }
    const siteSummaryText = siteSummaryLines.length
      ? `\n\nProject site:\n${siteSummaryLines.join("\n")}`
      : "";

    const htmlBody = `
<!DOCTYPE html>
<html><body style="font-family: system-ui, -apple-system, sans-serif; color: #1f2937;">
<h2>New online order received</h2>
<p><strong>Order #:</strong> ${orderNumber}<br>
<strong>Customer:</strong> ${data.name}<br>
<strong>Email:</strong> ${data.email}<br>
<strong>Phone:</strong> ${data.phone}<br>
<strong>Fulfillment:</strong> ${data.fulfillment === "pickup" ? "Pickup at yard" : "Delivery"}</p>
${data.deliveryAddress ? `<p><strong>Delivery Address:</strong><br>${data.deliveryAddress}</p>` : ""}
${data.deliveryNotes ? `<p><strong>Notes:</strong> ${data.deliveryNotes}</p>` : ""}
${
  site
    ? `
<h3>Project site (customer-captured)</h3>
${site.address ? `<p><strong>Address:</strong> ${site.address}</p>` : ""}
${
  site.estimate
    ? `<p><strong>Estimate:</strong> ${site.estimate.tons.toFixed(1)} tons (${site.estimate.cubicYards.toFixed(1)} cu yd) over ${site.totalAreaSqFt?.toFixed(0) ?? "?"} sq ft @ ${site.depthInches ?? "?"}" depth<br>
<em>This is a customer self-estimate, not survey data.</em></p>`
    : ""
}
${
  projectMapImageUrl
    ? `<p><img src="${projectMapImageUrl}" alt="Project area outlined on satellite map" style="max-width:640px;border:1px solid #d1d5db;border-radius:8px"></p>`
    : ""
}
`
    : ""
}
<h3>Items</h3>
<pre style="font-family:ui-monospace,Menlo,monospace;background:#f9fafb;padding:12px;border-radius:8px">${itemsList}</pre>
<p>
Subtotal: $${validatedPrices.subtotal.toFixed(2)}<br>
Tax (7.25%): $${validatedPrices.tax.toFixed(2)}<br>
Processing Fee (4.5%): $${validatedPrices.processingFee.toFixed(2)}<br>
<strong>Total: $${validatedPrices.total.toFixed(2)}</strong>
</p>
<p style="color:#6b7280;font-size:12px">Payment: Pending — Stripe not configured, customer will pay on pickup/delivery.</p>
</body></html>
    `.trim();

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
${data.deliveryNotes ? `Notes: ${data.deliveryNotes}` : ""}${siteSummaryText}

Items:
${itemsList}

Subtotal: $${validatedPrices.subtotal.toFixed(2)}
Tax (7.25%): $${validatedPrices.tax.toFixed(2)}
Processing Fee (4.5%): $${validatedPrices.processingFee.toFixed(2)}
Total: $${validatedPrices.total.toFixed(2)}

Payment: Pending — Stripe not configured, customer will pay on pickup/delivery.
      `.trim(),
      htmlBody,
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

/**
 * Helper function to send email notification for purchase order payments
 */
async function sendPurchaseOrderEmail(
  data: any,
  order: any,
  validatedPrices: any,
  site: any,
  projectMapImageUrl: string | null
) {
  const itemsList = data.items
    .map((i: any) => `  - ${i.name}: ${i.quantity} ${i.unit}(s) @ $${i.price.toFixed(2)} = $${(i.price * i.quantity).toFixed(2)}`)
    .join("\n");

  const siteSummaryLines: string[] = [];
  if (site) {
    if (site.address) {
      siteSummaryLines.push(`Project address: ${site.address}`);
    }
    if (site.estimate) {
      siteSummaryLines.push(
        `Estimate: ${site.estimate.tons.toFixed(1)} tons (${site.estimate.cubicYards.toFixed(1)} cu yd) over ${site.totalAreaSqFt?.toFixed(0) ?? "?"} sq ft @ ${site.depthInches ?? "?"}" depth — source: ${site.mode}`,
      );
    }
    if (projectMapImageUrl) {
      siteSummaryLines.push(`Satellite outline: ${projectMapImageUrl}`);
    }
  }
  const siteSummaryText = siteSummaryLines.length
    ? `\n\nProject site:\n${siteSummaryLines.join("\n")}`
    : "";

  const htmlBody = `
<!DOCTYPE html>
<html><body style="font-family: system-ui, -apple-system, sans-serif; color: #1f2937;">
<h2>New online order received (Purchase Order)</h2>
<p><strong>Order #:</strong> ${order.orderNumber}<br>
<strong>PO Number:</strong> ${data.purchaseOrderNumber}<br>
<strong>Customer:</strong> ${data.name}<br>
<strong>Email:</strong> ${data.email}<br>
<strong>Phone:</strong> ${data.phone}<br>
<strong>Fulfillment:</strong> ${data.fulfillment === "pickup" ? "Pickup at yard" : "Delivery"}</p>
${data.deliveryAddress ? `<p><strong>Delivery Address:</strong><br>${data.deliveryAddress}</p>` : ""}
${data.deliveryNotes ? `<p><strong>Notes:</strong> ${data.deliveryNotes}</p>` : ""}
${
  site
    ? `
<h3>Project site (customer-captured)</h3>
${site.address ? `<p><strong>Address:</strong> ${site.address}</p>` : ""}
${
  site.estimate
    ? `<p><strong>Estimate:</strong> ${site.estimate.tons.toFixed(1)} tons (${site.estimate.cubicYards.toFixed(1)} cu yd) over ${site.totalAreaSqFt?.toFixed(0) ?? "?"} sq ft @ ${site.depthInches ?? "?"}" depth<br>
<em>This is a customer self-estimate, not survey data.</em></p>`
    : ""
}
${
  projectMapImageUrl
    ? `<p><img src="${projectMapImageUrl}" alt="Project area outlined on satellite map" style="max-width:640px;border:1px solid #d1d5db;border-radius:8px"></p>`
    : ""
}
`
    : ""
}
<h3>Items</h3>
<pre style="font-family:ui-monospace,Menlo,monospace;background:#f9fafb;padding:12px;border-radius:8px">${itemsList}</pre>
<p>
Subtotal: $${validatedPrices.subtotal.toFixed(2)}<br>
Tax (7.25%): $${validatedPrices.tax.toFixed(2)}<br>
Processing Fee (4.5%): $${validatedPrices.processingFee.toFixed(2)}<br>
<strong>Total: $${validatedPrices.total.toFixed(2)}</strong>
</p>
<p style="color:#059669;font-weight:bold">Payment: Purchase Order ${data.purchaseOrderNumber}</p>
</body></html>
  `.trim();

  await sendEmail({
    to: "sales@muskingummaterials.com",
    subject: `New PO Order ${order.orderNumber} from ${data.name}`,
    textBody: `
New online order received (Purchase Order)!

Order #: ${order.orderNumber}
PO Number: ${data.purchaseOrderNumber}
Customer: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Fulfillment: ${data.fulfillment === "pickup" ? "Pickup at yard" : "Delivery"}
${data.deliveryAddress ? `Delivery Address: ${data.deliveryAddress}` : ""}
${data.deliveryNotes ? `Notes: ${data.deliveryNotes}` : ""}${siteSummaryText}

Items:
${itemsList}

Subtotal: $${validatedPrices.subtotal.toFixed(2)}
Tax (7.25%): $${validatedPrices.tax.toFixed(2)}
Processing Fee (4.5%): $${validatedPrices.processingFee.toFixed(2)}
Total: $${validatedPrices.total.toFixed(2)}

Payment: Purchase Order ${data.purchaseOrderNumber}
    `.trim(),
    htmlBody,
    replyTo: data.email,
  });

  logger.info('Purchase order notification email sent', {
    orderNumber: order.orderNumber,
    recipient: 'sales@muskingummaterials.com',
  });

  addBreadcrumb('Email notification sent', 'email', {
    orderNumber: order.orderNumber,
  });
}

/**
 * Helper function to send email notification for net terms payments
 */
async function sendNetTermsEmail(
  data: any,
  order: any,
  invoice: any,
  validatedPrices: any,
  site: any,
  projectMapImageUrl: string | null
) {
  const itemsList = data.items
    .map((i: any) => `  - ${i.name}: ${i.quantity} ${i.unit}(s) @ $${i.price.toFixed(2)} = $${(i.price * i.quantity).toFixed(2)}`)
    .join("\n");

  const siteSummaryLines: string[] = [];
  if (site) {
    if (site.address) {
      siteSummaryLines.push(`Project address: ${site.address}`);
    }
    if (site.estimate) {
      siteSummaryLines.push(
        `Estimate: ${site.estimate.tons.toFixed(1)} tons (${site.estimate.cubicYards.toFixed(1)} cu yd) over ${site.totalAreaSqFt?.toFixed(0) ?? "?"} sq ft @ ${site.depthInches ?? "?"}" depth — source: ${site.mode}`,
      );
    }
    if (projectMapImageUrl) {
      siteSummaryLines.push(`Satellite outline: ${projectMapImageUrl}`);
    }
  }
  const siteSummaryText = siteSummaryLines.length
    ? `\n\nProject site:\n${siteSummaryLines.join("\n")}`
    : "";

  const dueDateFormatted = invoice.dueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const htmlBody = `
<!DOCTYPE html>
<html><body style="font-family: system-ui, -apple-system, sans-serif; color: #1f2937;">
<h2>New online order received (Net Terms)</h2>
<p><strong>Order #:</strong> ${order.orderNumber}<br>
<strong>Invoice #:</strong> ${invoice.invoiceNumber}<br>
<strong>Due Date:</strong> ${dueDateFormatted}<br>
<strong>Customer:</strong> ${data.name}<br>
<strong>Email:</strong> ${data.email}<br>
<strong>Phone:</strong> ${data.phone}<br>
<strong>Fulfillment:</strong> ${data.fulfillment === "pickup" ? "Pickup at yard" : "Delivery"}</p>
${data.deliveryAddress ? `<p><strong>Delivery Address:</strong><br>${data.deliveryAddress}</p>` : ""}
${data.deliveryNotes ? `<p><strong>Notes:</strong> ${data.deliveryNotes}</p>` : ""}
${
  site
    ? `
<h3>Project site (customer-captured)</h3>
${site.address ? `<p><strong>Address:</strong> ${site.address}</p>` : ""}
${
  site.estimate
    ? `<p><strong>Estimate:</strong> ${site.estimate.tons.toFixed(1)} tons (${site.estimate.cubicYards.toFixed(1)} cu yd) over ${site.totalAreaSqFt?.toFixed(0) ?? "?"} sq ft @ ${site.depthInches ?? "?"}" depth<br>
<em>This is a customer self-estimate, not survey data.</em></p>`
    : ""
}
${
  projectMapImageUrl
    ? `<p><img src="${projectMapImageUrl}" alt="Project area outlined on satellite map" style="max-width:640px;border:1px solid #d1d5db;border-radius:8px"></p>`
    : ""
}
`
    : ""
}
<h3>Items</h3>
<pre style="font-family:ui-monospace,Menlo,monospace;background:#f9fafb;padding:12px;border-radius:8px">${itemsList}</pre>
<p>
Subtotal: $${validatedPrices.subtotal.toFixed(2)}<br>
Tax (7.25%): $${validatedPrices.tax.toFixed(2)}<br>
Processing Fee (4.5%): $${validatedPrices.processingFee.toFixed(2)}<br>
<strong>Total: $${validatedPrices.total.toFixed(2)}</strong>
</p>
<p style="color:#2563eb;font-weight:bold">Payment: Net Terms — Invoice ${invoice.invoiceNumber} due ${dueDateFormatted}</p>
</body></html>
  `.trim();

  await sendEmail({
    to: "sales@muskingummaterials.com",
    subject: `New Net Terms Order ${order.orderNumber} from ${data.name}`,
    textBody: `
New online order received (Net Terms)!

Order #: ${order.orderNumber}
Invoice #: ${invoice.invoiceNumber}
Due Date: ${dueDateFormatted}
Customer: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Fulfillment: ${data.fulfillment === "pickup" ? "Pickup at yard" : "Delivery"}
${data.deliveryAddress ? `Delivery Address: ${data.deliveryAddress}` : ""}
${data.deliveryNotes ? `Notes: ${data.deliveryNotes}` : ""}${siteSummaryText}

Items:
${itemsList}

Subtotal: $${validatedPrices.subtotal.toFixed(2)}
Tax (7.25%): $${validatedPrices.tax.toFixed(2)}
Processing Fee (4.5%): $${validatedPrices.processingFee.toFixed(2)}
Total: $${validatedPrices.total.toFixed(2)}

Payment: Net Terms — Invoice ${invoice.invoiceNumber} due ${dueDateFormatted}
    `.trim(),
    htmlBody,
    replyTo: data.email,
  });

  logger.info('Net terms notification email sent', {
    orderNumber: order.orderNumber,
    invoiceNumber: invoice.invoiceNumber,
    recipient: 'sales@muskingummaterials.com',
  });

  addBreadcrumb('Email notification sent', 'email', {
    orderNumber: order.orderNumber,
    invoiceNumber: invoice.invoiceNumber,
  });
}
