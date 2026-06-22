import { logger } from "@/lib/logger";
import { addBreadcrumb } from "@/lib/monitoring";

/**
 * Result of charging a saved payment method
 */
interface ChargeResult {
  success: boolean;
  paymentIntentId?: string;
  receiptUrl?: string;
  error?: string;
}

/**
 * Parameters for charging a saved payment method
 */
interface ChargeParams {
  paymentMethodId: string;
  customerId: string;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Charges a saved payment method using Stripe PaymentIntents
 *
 * Security:
 * - Requires STRIPE_SECRET_KEY environment variable
 * - Uses server-side Stripe API with secret key (never exposed to client)
 * - Validates payment method belongs to customer via Stripe
 * - Amount must be server-validated before calling this function
 *
 * @param params - Charge parameters including payment method, customer, and amount
 * @returns ChargeResult with success status, payment intent ID, and receipt URL
 */
export async function chargePaymentMethod(
  params: ChargeParams
): Promise<ChargeResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.error(
      "Stripe charge failed: configuration missing",
      new Error("STRIPE_SECRET_KEY not configured")
    );
    return {
      success: false,
      error: "Payment processing not configured",
    };
  }

  const {
    paymentMethodId,
    customerId,
    amount,
    currency = "usd",
    description,
    metadata = {},
  } = params;

  // Validate amount is positive
  if (amount <= 0) {
    logger.warn("Stripe charge rejected: invalid amount", {
      amount,
      customerId,
      paymentMethodId,
    });
    return {
      success: false,
      error: "Invalid amount",
    };
  }

  try {
    const stripe = (await import("stripe")).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);

    addBreadcrumb("Creating PaymentIntent for saved payment method", "payment", {
      customerId,
      paymentMethodId,
      amount,
      currency,
    });

    // Create and confirm PaymentIntent with the saved payment method
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert dollars to cents
      currency,
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true, // Immediately confirm the payment
      description,
      metadata,
      // Enable automatic confirmation without additional authentication
      off_session: true,
      // Request receipt URL in the response
      expand: ["latest_charge"],
    });

    // Extract receipt URL from the charge
    let receiptUrl: string | null = null;
    const charge = paymentIntent.latest_charge as import("stripe").Stripe.Charge | null;
    receiptUrl = charge?.receipt_url ?? null;

    logger.info("Payment charged successfully with saved payment method", {
      paymentIntentId: paymentIntent.id,
      customerId,
      paymentMethodId,
      amount,
      status: paymentIntent.status,
      timestamp: new Date().toISOString(),
    });

    addBreadcrumb("PaymentIntent confirmed", "payment", {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      receiptUrl: receiptUrl ?? undefined,
    };
  } catch (error) {
    // Handle Stripe-specific errors
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    logger.error("Failed to charge saved payment method", error, {
      customerId,
      paymentMethodId,
      amount,
      timestamp: new Date().toISOString(),
    });

    // Check for common Stripe error types
    let userFriendlyError = "Payment failed";
    if (errorMessage.includes("insufficient_funds")) {
      userFriendlyError = "Insufficient funds";
    } else if (errorMessage.includes("card_declined")) {
      userFriendlyError = "Card declined";
    } else if (errorMessage.includes("expired_card")) {
      userFriendlyError = "Card expired";
    } else if (errorMessage.includes("authentication_required")) {
      userFriendlyError = "Additional authentication required";
    }

    return {
      success: false,
      error: userFriendlyError,
    };
  }
}
