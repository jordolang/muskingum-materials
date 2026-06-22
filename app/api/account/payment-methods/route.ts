import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { savedPaymentMethodCreateSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

/**
 * List saved payment methods for authenticated user.
 *
 * @access authenticated (Clerk)
 * @returns 200 `{ paymentMethods: SavedPaymentMethod[] }` sorted by isDefault desc, createdAt desc
 * @returns 401 `{ error: "Unauthorized" }` when Clerk session is missing or invalid
 * @returns 500 `{ error: "Failed to fetch payment methods" }` on database error
 * @see prisma.savedPaymentMethod model in schema.prisma for field definitions
 * @see middleware.ts for Clerk auth configuration
 * @remarks Results are ordered to show default payment method first, then by creation date.
 *   Database errors are logged via logger but do not expose internal details to client.
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
 * Create and save a payment method for authenticated user.
 *
 * @access authenticated (Clerk)
 * @param request - Incoming request with body validated against `savedPaymentMethodCreateSchema`
 *   (stripePaymentMethodId, isDefault, optional brand/last4/expiry). See lib/schemas.ts.
 * @returns 201 `{ paymentMethod: SavedPaymentMethod }` on successful creation
 * @returns 400 `{ error: "Invalid data", details: ZodError[] }` when validation fails
 * @returns 401 `{ error: "Unauthorized" }` when Clerk session is missing or invalid
 * @returns 500 `{ error: "Failed to create payment method" }` on database or Stripe error
 * @throws 400 `{ error: "Invalid data", details: ZodError[] }` when schema validation fails
 * @see savedPaymentMethodCreateSchema in lib/schemas.ts for request body schema
 * @see middleware.ts for Clerk auth configuration
 * @see prisma.savedPaymentMethod model in schema.prisma for field definitions
 * @remarks When `isDefault` is true, automatically sets all other user payment methods to
 *   `isDefault: false` via `updateMany` before creating the new record. If `STRIPE_SECRET_KEY`
 *   is configured, enriches the payload with card brand/last4/expiry from Stripe's
 *   `paymentMethods.retrieve` API; Stripe failures are logged but do not fail the request
 *   (falls back to client-provided data). Database errors are logged via logger but do not
 *   expose internal details to client.
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
          brand: data.brand || pm.card?.brand || undefined,
          last4: data.last4 || pm.card?.last4 || undefined,
          expiryMonth: data.expiryMonth || pm.card?.exp_month || undefined,
          expiryYear: data.expiryYear || pm.card?.exp_year || undefined,
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
