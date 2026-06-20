import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { savedPaymentMethodCreateSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

/**
 * GET /api/account/payment-methods
 * Fetches all saved payment methods for the authenticated user
 *
 * Auth: Requires Clerk authentication
 * Returns: { paymentMethods: SavedPaymentMethod[] } sorted by isDefault desc, then createdAt desc
 */
export async function GET() {
  let session;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paymentMethods = await prisma.savedPaymentMethod.findMany({
      where: { userId: session.userId },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    logger.info("Payment methods fetched successfully", {
      userId: session.userId,
      count: paymentMethods.length,
    });

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    logger.error("Failed to fetch payment methods", error, {
      userId: session?.userId,
    });
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/account/payment-methods
 * Creates a new saved payment method for the authenticated user
 *
 * Auth: Requires Clerk authentication
 * Request body: savedPaymentMethodCreateSchema
 * Returns: { paymentMethod: SavedPaymentMethod }
 *
 * Note: If isDefault is true, all other payment methods for this user are set to isDefault: false
 */
export async function POST(request: NextRequest) {
  let session;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = savedPaymentMethodCreateSchema.parse(body);

    // Retrieve full payment method details from Stripe if not provided
    let paymentMethodData = { ...data };

    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "your_stripe_secret_key") {
      try {
        const stripe = (await import("stripe")).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);

        const pm = await stripeClient.paymentMethods.retrieve(data.stripePaymentMethodId);

        // Override with Stripe data if not already provided
        paymentMethodData = {
          ...data,
          brand: data.brand || pm.card?.brand || null,
          last4: data.last4 || pm.card?.last4 || null,
          expiryMonth: data.expiryMonth || pm.card?.exp_month || null,
          expiryYear: data.expiryYear || pm.card?.exp_year || null,
        };
      } catch (stripeError) {
        logger.warn("Failed to retrieve payment method details from Stripe", {
          userId: session.userId,
          stripePaymentMethodId: data.stripePaymentMethodId,
          error: stripeError,
        });
        // Continue with provided data
      }
    }

    // If this is being set as default, unset all other defaults first
    if (paymentMethodData.isDefault) {
      await prisma.savedPaymentMethod.updateMany({
        where: { userId: session.userId },
        data: { isDefault: false },
      });
    }

    const paymentMethod = await prisma.savedPaymentMethod.create({
      data: {
        userId: session.userId,
        ...paymentMethodData,
      },
    });

    logger.info("Payment method created successfully", {
      userId: session.userId,
      paymentMethodId: paymentMethod.id,
      isDefault: paymentMethod.isDefault,
    });

    return NextResponse.json({ paymentMethod }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Payment method creation validation failed", {
        userId: session?.userId,
        errors: error.errors,
      });
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Failed to create payment method", error, {
      userId: session?.userId,
    });
    return NextResponse.json(
      { error: "Failed to create payment method" },
      { status: 500 }
    );
  }
}
