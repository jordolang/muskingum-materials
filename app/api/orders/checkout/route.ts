import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/schemas";
import { validateCheckoutPrices } from "@/lib/validate-checkout-prices";
import { validateCreditLimit } from "@/lib/validate-credit-limit";
import { generateInvoice } from "@/lib/generate-invoice";
import { sendEmail, sendNotificationEmail } from "@/lib/email-service";
import { logger } from "@/lib/logger";
import { addBreadcrumb, startTransaction } from "@/lib/monitoring";
import { buildSatelliteMapUrl } from "@/lib/static-map";
import { ORDER_NUMBER_PREFIX } from "@/lib/constants/business-rules";
import { isSlotAvailable, bookSlot } from "@/lib/delivery-scheduling";

type CheckoutPayload = z.infer<typeof checkoutSchema>;
type CheckoutItem = CheckoutPayload["items"][number];
type CheckoutSite = CheckoutPayload["projectSite"] | null;
type OrderEmailPrices = {
  subtotal: number;
  tax: number;
  processingFee: number;
  total: number;
};

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
 * Checkout endpoint for processing customer orders with multiple payment methods.
 *
 * @access public
 * @param request - Incoming request with body validated against `checkoutSchema`
 *   (name, email, phone, items, fulfillment, deliveryAddress, deliveryNotes,
 *   deliveryAccessChecklist, dropLocation, accessWarnings, projectSite, paymentMethod,
 *   purchaseOrderNumber, savedPaymentMethodId, smsOptIn, termsAccepted).
 *   See lib/schemas.ts for the complete schema definition.
 *
 * @returns 200 `{ url: string, analytics: object }` for Stripe Checkout flow - redirects to Stripe
 * @returns 200 `{ orderNumber: string, paymentMethod: 'purchase_order', analytics: object }` for PO flow
 * @returns 200 `{ orderNumber: string, invoiceNumber: string, dueDate: Date, paymentMethod: 'net_terms', analytics: object }` for net terms flow
 * @returns 200 `{ orderNumber: string, analytics: object }` for pay-on-pickup fallback when Stripe is not configured
 *
 * @throws 400 `{ error: string }` when price validation fails (client-supplied prices don't match product catalog)
 * @throws 400 `{ error: "Invalid order data", details: ZodError[] }` when validation fails
 * @throws 400 `{ error: string }` when credit limit is exceeded for net terms payment
 * @throws 401 `{ error: "You must be logged in to use net terms payment" }` when net terms requested without authentication
 * @throws 500 `{ error: "Failed to create order..." }` when database order creation fails
 * @throws 500 `{ error: "Failed to create invoice..." }` when invoice generation fails for net terms
 * @throws 500 `{ error: "Checkout failed..." }` for unexpected errors
 * @throws 501 `{ error: "Saved payment method checkout is not yet available..." }` when saved payment method is requested (not yet implemented)
 *
 * @see rateLimitedEndpoints in middleware.ts — contact-quote tier (10 req/hour per IP)
 * @see RATE_LIMIT_TIERS in lib/rate-limit.ts for tier configuration
 * @see validateCheckoutPrices in lib/validate-checkout-prices.ts — trust boundary for price validation
 * @see checkoutSchema in lib/schemas.ts for request validation schema
 *
 * @remarks
 * Payment Methods:
 * - **stripe** (default): Creates Stripe Checkout Session with line items for products, tax (7.25%),
 *   and processing fee (4.5%). Redirects to Stripe hosted checkout. Order marked as "unpaid"/"pending"
 *   until webhook confirms payment. Mapped to PaymentMethod.CARD in database.
 * - **purchase_order**: Skips Stripe, records PO number, sends email notification to sales team.
 *   No upfront payment required. Mapped to PaymentMethod.PURCHASE_ORDER.
 * - **net_terms**: Requires authentication. Validates credit limit, creates invoice with due date based
 *   on contractor's netTermsLength (e.g., Net 30), increments contractor's netTermsBalance, sends invoice
 *   email. Mapped to PaymentMethod.NET_TERMS.
 * - **saved_payment_method**: Not yet implemented (returns 501). Will charge saved card via Stripe
 *   PaymentIntent. Mapped to PaymentMethod.SAVED_PAYMENT_METHOD.
 *
 * Security:
 * - Never trusts client-supplied prices — always validates against Prisma Product table via
 *   `validateCheckoutPrices` to prevent price manipulation attacks.
 * - Contractor discounts (if authenticated and profile.isContractor) are applied server-side during validation.
 * - Rate limiting enforced by middleware (10 requests/hour per IP).
 *
 * Stripe Integration:
 * - Creates Checkout Session with `payment_method_types: ["card"]` and line items for products, tax, processing fee.
 * - Stores session ID in order.stripeSessionId for reconciliation.
 * - Webhook at /api/orders/webhook handles checkout.session.completed to update order status and payment details.
 * - Gracefully falls back to pay-on-pickup flow if STRIPE_SECRET_KEY is missing or session creation fails.
 *
 * Project Site Capture:
 * - Captures customer-drawn polygons or location pins from material estimator.
 * - Generates satellite map image URL via `buildSatelliteMapUrl` for order confirmation, admin views, emails.
 * - Stores project area, depth, estimated tons/cubic yards, and polygon coordinates in order record.
 *
 * Email Notifications:
 * - Stripe: No immediate email (webhook sends confirmation after payment).
 * - Purchase Order: Sends email to sales@muskingummaterials.com with order details and PO number.
 * - Net Terms: Sends email to sales@muskingummaterials.com with invoice number and due date.
 * - Pay-on-pickup: Sends email to sales@muskingummaterials.com with order details.
 *
 * Monitoring:
 * - Wrapped in Sentry transaction for performance tracking.
 * - Breadcrumbs logged for checkout flow, order creation, Stripe session, email notifications.
 * - DB and Stripe failures logged with full context for debugging.
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

    // Validate delivery slot availability if delivery is selected
    if (data.fulfillment === "delivery" && data.deliveryDate && data.deliveryTimeWindow) {
      try {
        const deliveryDate = new Date(data.deliveryDate);
        const slotAvailable = await isSlotAvailable(deliveryDate, data.deliveryTimeWindow);

        if (!slotAvailable) {
          logger.warn('Delivery slot not available', {
            date: data.deliveryDate,
            window: data.deliveryTimeWindow,
            email: data.email,
          });

          return NextResponse.json(
            { error: "Selected delivery slot is no longer available. Please choose a different date or time window." },
            { status: 400 }
          );
        }

        addBreadcrumb('Delivery slot validated', 'checkout', {
          date: data.deliveryDate,
          window: data.deliveryTimeWindow,
        });

        logger.info('Delivery slot validated', {
          date: data.deliveryDate,
          window: data.deliveryTimeWindow,
          email: data.email,
        });
      } catch (slotError) {
        logger.error('Delivery slot validation failed', slotError, {
          date: data.deliveryDate,
          window: data.deliveryTimeWindow,
          email: data.email,
        });

        return NextResponse.json(
          { error: "Failed to validate delivery slot. Please try again or call (740) 319-0183." },
          { status: 500 }
        );
      }
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
          deliveryAccessChecklist: data.deliveryAccessChecklist || undefined,
          dropLocationNotes: data.dropLocation?.notes || null,
          dropLocationPhotoUrl: data.dropLocation?.photoUrl || null,
          dropLocationLat: data.dropLocation?.lat ?? null,
          dropLocationLng: data.dropLocation?.lng ?? null,
          accessWarningFlags: data.accessWarnings || undefined,
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
          projectEstimateTonsLow: site?.estimate?.tonsLow ?? null,
          projectEstimateTonsHigh: site?.estimate?.tonsHigh ?? null,
          projectEstimateCubicYards: site?.estimate?.cubicYards ?? null,
          projectEstimateCubicYardsLow: site?.estimate?.cubicYardsLow ?? null,
          projectEstimateCubicYardsHigh: site?.estimate?.cubicYardsHigh ?? null,
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

      // Book delivery slot if delivery was selected with a date/time window
      if (data.fulfillment === "delivery" && data.deliveryDate && data.deliveryTimeWindow) {
        try {
          const deliveryDate = new Date(data.deliveryDate);
          const scheduledSlotId = await bookSlot(order.id, deliveryDate, data.deliveryTimeWindow);

          // Update order with delivery scheduling details
          await prisma.order.update({
            where: { id: order.id },
            data: {
              deliveryDate,
              deliveryTimeWindow: data.deliveryTimeWindow,
              scheduledSlotId,
            },
          });

          logger.info('Delivery slot booked successfully', {
            orderNumber,
            orderId: order.id,
            date: data.deliveryDate,
            window: data.deliveryTimeWindow,
            slotId: scheduledSlotId,
          });

          addBreadcrumb('Delivery slot booked', 'checkout', {
            orderNumber,
            slotId: scheduledSlotId,
          });
        } catch (slotBookingError) {
          logger.error('Delivery slot booking failed', slotBookingError, {
            orderNumber,
            orderId: order.id,
            date: data.deliveryDate,
            window: data.deliveryTimeWindow,
          });

          // Order was created but slot booking failed
          // Return error but with order number so customer can contact support
          return NextResponse.json(
            {
              error: "Order created but delivery slot booking failed. Please call (740) 319-0183 to schedule your delivery.",
              orderNumber,
            },
            { status: 500 }
          );
        }
      }
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

    // Format delivery date and time window for email
    let deliveryScheduleText = "";
    let deliveryScheduleHtml = "";
    if (data.fulfillment === "delivery" && data.deliveryDate && data.deliveryTimeWindow) {
      const deliveryDate = new Date(data.deliveryDate);
      const formattedDate = deliveryDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const timeWindowMap: Record<string, string> = {
        morning: "Morning (8 AM - 12 PM)",
        afternoon: "Afternoon (12 PM - 4 PM)",
        evening: "Evening (4 PM - 7 PM)",
      };
      const formattedWindow = timeWindowMap[data.deliveryTimeWindow] || data.deliveryTimeWindow;

      deliveryScheduleText = `\nScheduled Delivery: ${formattedDate}\nTime Window: ${formattedWindow}`;
      deliveryScheduleHtml = `<p><strong>Scheduled Delivery:</strong> ${formattedDate}<br><strong>Time Window:</strong> ${formattedWindow}</p>`;
    }

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

    // Build access warnings section for email
    const accessWarningsHtml = data.accessWarnings && data.accessWarnings.length > 0
      ? `
<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px;margin:16px 0;border-radius:4px">
<h3 style="color:#dc2626;margin-top:0">⚠️ Delivery Access Warnings</h3>
<ul style="margin:8px 0;padding-left:20px">
${data.accessWarnings.map(warning => {
  const labels: Record<string, string> = {
    narrow_driveway: "Narrow driveway (less than 10ft)",
    low_clearance: "Low overhead clearance (less than 14ft)",
    tight_turning: "Tight turning space",
    poor_surface: "Poor surface condition"
  };
  return `<li>${labels[warning] || warning}</li>`;
}).join("\n")}
</ul>
</div>
`
      : "";

    // Build access checklist details for email
    const checklistHtml = data.deliveryAccessChecklist
      ? `
<h3>Delivery Access Checklist</h3>
<ul style="list-style:none;padding-left:0">
${data.deliveryAccessChecklist.drivewayWidth ? `<li><strong>Driveway Width:</strong> ${data.deliveryAccessChecklist.drivewayWidth.replace(/_/g, " ")}</li>` : ""}
${data.deliveryAccessChecklist.overheadClearance ? `<li><strong>Overhead Clearance:</strong> ${data.deliveryAccessChecklist.overheadClearance.replace(/_/g, " ")}</li>` : ""}
${data.deliveryAccessChecklist.turningRoom ? `<li><strong>Turning Room:</strong> ${data.deliveryAccessChecklist.turningRoom}</li>` : ""}
${data.deliveryAccessChecklist.surface ? `<li><strong>Surface Type:</strong> ${data.deliveryAccessChecklist.surface}</li>` : ""}
${data.deliveryAccessChecklist.gateCode ? `<li><strong>Gate Code:</strong> ${data.deliveryAccessChecklist.gateCode}</li>` : ""}
${data.deliveryAccessChecklist.accessInstructions ? `<li><strong>Access Instructions:</strong> ${data.deliveryAccessChecklist.accessInstructions}</li>` : ""}
</ul>
`
      : "";

    // Build drop location section for email
    const dropLocationHtml = data.dropLocation
      ? `
<h3>Drop Location</h3>
${data.dropLocation.notes ? `<p><strong>Drop Location Notes:</strong> ${data.dropLocation.notes}</p>` : ""}
${data.dropLocation.lat && data.dropLocation.lng ? `<p><strong>Drop Location Coordinates:</strong> ${data.dropLocation.lat.toFixed(6)}, ${data.dropLocation.lng.toFixed(6)}<br><a href="https://www.google.com/maps?q=${data.dropLocation.lat},${data.dropLocation.lng}" target="_blank">View on Google Maps</a></p>` : ""}
${data.dropLocation.photoUrl ? `<p><strong>Drop Location Photo:</strong><br><img src="${data.dropLocation.photoUrl}" alt="Drop location reference photo" style="max-width:480px;border:1px solid #d1d5db;border-radius:8px;margin-top:8px"></p>` : ""}
`
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
${deliveryScheduleHtml}
${data.deliveryAddress ? `<p><strong>Delivery Address:</strong><br>${data.deliveryAddress}</p>` : ""}
${data.deliveryNotes ? `<p><strong>Notes:</strong> ${data.deliveryNotes}</p>` : ""}
${accessWarningsHtml}
${checklistHtml}
${dropLocationHtml}
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

    // Build access warnings section for plain text email
    const accessWarningsText = data.accessWarnings && data.accessWarnings.length > 0
      ? `\n\n⚠️ DELIVERY ACCESS WARNINGS:\n${data.accessWarnings.map(warning => {
  const labels: Record<string, string> = {
    narrow_driveway: "Narrow driveway (less than 10ft)",
    low_clearance: "Low overhead clearance (less than 14ft)",
    tight_turning: "Tight turning space",
    poor_surface: "Poor surface condition"
  };
  return `  - ${labels[warning] || warning}`;
}).join("\n")}`
      : "";

    // Build access checklist details for plain text email
    const checklistText = data.deliveryAccessChecklist
      ? `\n\nDelivery Access Checklist:\n${[
          data.deliveryAccessChecklist.drivewayWidth && `  Driveway Width: ${data.deliveryAccessChecklist.drivewayWidth.replace(/_/g, " ")}`,
          data.deliveryAccessChecklist.overheadClearance && `  Overhead Clearance: ${data.deliveryAccessChecklist.overheadClearance.replace(/_/g, " ")}`,
          data.deliveryAccessChecklist.turningRoom && `  Turning Room: ${data.deliveryAccessChecklist.turningRoom}`,
          data.deliveryAccessChecklist.surface && `  Surface Type: ${data.deliveryAccessChecklist.surface}`,
          data.deliveryAccessChecklist.gateCode && `  Gate Code: ${data.deliveryAccessChecklist.gateCode}`,
          data.deliveryAccessChecklist.accessInstructions && `  Access Instructions: ${data.deliveryAccessChecklist.accessInstructions}`,
        ].filter(Boolean).join("\n")}`
      : "";

    // Build drop location section for plain text email
    const dropLocationText = data.dropLocation
      ? `\n\nDrop Location:\n${[
          data.dropLocation.notes && `  Notes: ${data.dropLocation.notes}`,
          data.dropLocation.lat && data.dropLocation.lng && `  Coordinates: ${data.dropLocation.lat.toFixed(6)}, ${data.dropLocation.lng.toFixed(6)}`,
          data.dropLocation.lat && data.dropLocation.lng && `  Map: https://www.google.com/maps?q=${data.dropLocation.lat},${data.dropLocation.lng}`,
          data.dropLocation.photoUrl && `  Photo: ${data.dropLocation.photoUrl}`,
        ].filter(Boolean).join("\n")}`
      : "";

    await sendNotificationEmail(
      `New Online Order ${orderNumber} from ${data.name}`,
      `
New online order received!

Order #: ${orderNumber}
Customer: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Fulfillment: ${data.fulfillment === "pickup" ? "Pickup at yard" : "Delivery"}${deliveryScheduleText}
${data.deliveryAddress ? `Delivery Address: ${data.deliveryAddress}` : ""}
${data.deliveryNotes ? `Notes: ${data.deliveryNotes}` : ""}${accessWarningsText}${checklistText}${dropLocationText}${siteSummaryText}

Items:
${itemsList}

Subtotal: $${validatedPrices.subtotal.toFixed(2)}
Tax (7.25%): $${validatedPrices.tax.toFixed(2)}
Processing Fee (4.5%): $${validatedPrices.processingFee.toFixed(2)}
Total: $${validatedPrices.total.toFixed(2)}

Payment: Pending — Stripe not configured, customer will pay on pickup/delivery.
      `.trim(),
      {
        replyTo: data.email,
        htmlBody,
        tag: "order-confirmation",
        metadata: {
          orderNumber,
          customerName: data.name,
          customerEmail: data.email,
          fulfillment: data.fulfillment,
          total: validatedPrices.total.toFixed(2),
        },
      }
    );

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
 * Sends email notification to sales@muskingummaterials.com for purchase order payments.
 *
 * Email includes:
 * - Order number and PO number
 * - Customer contact info (name, email, phone)
 * - Fulfillment method (pickup or delivery) with address and delivery notes
 * - Project site details: address, area estimate (tons/cubic yards), satellite map image
 * - Line items with quantities, unit prices, and totals
 * - Price breakdown (subtotal, tax, processing fee, total)
 * - Payment method: "Purchase Order {poNumber}"
 *
 * @param data - Validated checkout payload from checkoutSchema
 * @param order - Order record with orderNumber (minimal shape for flexibility)
 * @param validatedPrices - Server-validated price breakdown (subtotal, tax, processingFee, total)
 * @param site - Project site data captured from material estimator (address, location, polygons, estimates)
 * @param projectMapImageUrl - Satellite map URL with drawn polygons, or null if no project site data
 *
 * @remarks
 * - Sent via `sendEmail` from lib/email-service.ts (Postmark or fallback)
 * - Reply-To set to customer's email for easy response
 * - Includes both plain text and HTML body for email client compatibility
 * - DB failures during email send do not fail the checkout request (best-effort)
 * - Logs success/failure to logger with orderNumber context
 */
async function sendPurchaseOrderEmail(
  data: CheckoutPayload,
  order: { orderNumber: string },
  validatedPrices: OrderEmailPrices,
  site: CheckoutSite,
  projectMapImageUrl: string | null
) {
  const itemsList = data.items
    .map((i: CheckoutItem) => `  - ${i.name}: ${i.quantity} ${i.unit}(s) @ $${i.price.toFixed(2)} = $${(i.price * i.quantity).toFixed(2)}`)
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
 * Sends email notification to sales@muskingummaterials.com for net terms payments.
 *
 * Email includes:
 * - Order number, invoice number, and formatted due date
 * - Customer contact info (name, email, phone)
 * - Fulfillment method (pickup or delivery) with address and delivery notes
 * - Project site details: address, area estimate (tons/cubic yards), satellite map image
 * - Line items with quantities, unit prices, and totals
 * - Price breakdown (subtotal, tax, processing fee, total)
 * - Payment method: "Net Terms — Invoice {invoiceNumber} due {dueDate}"
 *
 * @param data - Validated checkout payload from checkoutSchema
 * @param order - Order record with orderNumber (minimal shape for flexibility)
 * @param invoice - Invoice record with invoiceNumber and dueDate from generateInvoice
 * @param validatedPrices - Server-validated price breakdown (subtotal, tax, processingFee, total)
 * @param site - Project site data captured from material estimator (address, location, polygons, estimates)
 * @param projectMapImageUrl - Satellite map URL with drawn polygons, or null if no project site data
 *
 * @remarks
 * - Sent via `sendEmail` from lib/email-service.ts (Postmark or fallback)
 * - Reply-To set to customer's email for easy response
 * - Includes both plain text and HTML body for email client compatibility
 * - Due date formatted as "Month DD, YYYY" (e.g., "June 21, 2026")
 * - DB failures during email send do not fail the checkout request (best-effort)
 * - Logs success/failure to logger with orderNumber and invoiceNumber context
 */
async function sendNetTermsEmail(
  data: CheckoutPayload,
  order: { orderNumber: string },
  invoice: { invoiceNumber: string; dueDate: Date },
  validatedPrices: OrderEmailPrices,
  site: CheckoutSite,
  projectMapImageUrl: string | null
) {
  const itemsList = data.items
    .map((i: CheckoutItem) => `  - ${i.name}: ${i.quantity} ${i.unit}(s) @ $${i.price.toFixed(2)} = $${(i.price * i.quantity).toFixed(2)}`)
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
