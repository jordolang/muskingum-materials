import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";

/**
 * Creates a Stripe SetupIntent for adding a new payment method to the user's account.
 *
 * @access authenticated
 * @returns 200 `{ clientSecret: string, customerId?: string }` on success
 * @returns 401 `{ error: "Unauthorized" }` when user is not authenticated
 * @returns 503 `{ error: "Payment processing is not configured" }` when Stripe is not configured
 * @returns 500 `{ error: "Failed to initialize payment method setup" }` on Stripe API or database errors
 * @see SavedPaymentMethod in prisma/schema.prisma for payment method storage
 * @remarks Creates a new Stripe customer if one doesn't exist for the user.
 *   Customer ID is retrieved from existing payment methods or created via Stripe API.
 *   Gracefully handles missing Stripe configuration by returning 503.
 */
export async function POST() {
  let session;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "your_stripe_secret_key") {
      logger.warn("Stripe not configured - setup intent creation skipped", {
        userId: session.userId,
      });
      return NextResponse.json(
        { error: "Payment processing is not configured" },
        { status: 503 }
      );
    }

    const stripe = (await import("stripe")).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);

    // Create or retrieve Stripe customer
    // First check if user already has a payment method with a customer ID
    const { prisma } = await import("@/lib/prisma");
    const existingMethod = await prisma.savedPaymentMethod.findFirst({
      where: { userId: session.userId },
      select: { stripeCustomerId: true },
      orderBy: { createdAt: "desc" },
    });

    let customerId = existingMethod?.stripeCustomerId || undefined;

    // If no customer exists, create one
    if (!customerId) {
      const { currentUser } = await import("@clerk/nextjs/server");
      const user = await currentUser();
      const email = user?.emailAddresses?.[0]?.emailAddress;

      const customer = await stripeClient.customers.create({
        email: email || undefined,
        metadata: {
          clerkUserId: session.userId,
        },
      });
      customerId = customer.id;
    }

    // Create SetupIntent
    const setupIntent = await stripeClient.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      metadata: {
        userId: session.userId,
      },
    });

    logger.info("SetupIntent created successfully", {
      userId: session.userId,
      setupIntentId: setupIntent.id,
      customerId,
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
    });
  } catch (error) {
    logger.error("Failed to create SetupIntent", error, {
      userId: session?.userId,
    });
    return NextResponse.json(
      { error: "Failed to initialize payment method setup" },
      { status: 500 }
    );
  }
}
