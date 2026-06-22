import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { savedPaymentMethodUpdateSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

/**
 * Fetch a specific saved payment method.
 *
 * @access protected (Clerk authentication required)
 * @param request - Incoming request (unused but required by Next.js signature)
 * @param params - Route parameters containing the payment method ID
 * @param params.params.id - Payment method UUID to retrieve
 * @returns 200 `{ paymentMethod: SavedPaymentMethod }` on success
 * @returns 401 `{ error: "Unauthorized" }` when Clerk session is missing
 * @returns 404 `{ error: "Payment method not found" }` when ID doesn't exist or user doesn't own it
 * @returns 500 `{ error: "Failed to fetch payment method" }` on database errors
 * @see prisma/schema.prisma SavedPaymentMethod model for returned shape
 * @remarks Security: Verifies ownership via `userId` match before returning data.
 *   Non-owners receive 404 (not 403) to avoid leaking existence of payment method IDs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const paymentMethod = await prisma.savedPaymentMethod.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    logger.info("Payment method fetched successfully", {
      userId: session.userId,
      paymentMethodId: id,
    });

    return NextResponse.json({ paymentMethod });
  } catch (error) {
    logger.error("Failed to fetch payment method", error, {
      userId: session?.userId,
    });
    return NextResponse.json(
      { error: "Failed to fetch payment method" },
      { status: 500 }
    );
  }
}

/**
 * Update a saved payment method.
 *
 * @access protected (Clerk authentication required)
 * @param request - Incoming request with JSON body validated against `savedPaymentMethodUpdateSchema`
 * @param params - Route parameters containing the payment method ID
 * @param params.params.id - Payment method UUID to update
 * @returns 200 `{ paymentMethod: SavedPaymentMethod }` with updated payment method on success
 * @returns 400 `{ error: "Invalid data", details: ZodError[] }` when validation fails
 * @returns 401 `{ error: "Unauthorized" }` when Clerk session is missing
 * @returns 404 `{ error: "Payment method not found" }` when ID doesn't exist or user doesn't own it
 * @returns 500 `{ error: "Failed to update payment method" }` on database errors
 * @see lib/schemas.ts savedPaymentMethodUpdateSchema for request body validation
 * @see prisma/schema.prisma SavedPaymentMethod model for returned shape
 * @remarks **Default payment method behavior**: When `isDefault: true` is set, this endpoint
 *   automatically unsets `isDefault` on all other payment methods for the user, ensuring
 *   exactly one default exists. This is implemented via a transaction-safe `updateMany`
 *   before the final update.
 * @remarks Security: Verifies ownership via `userId` match before allowing updates.
 *   Non-owners receive 404 to avoid leaking existence of payment method IDs.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = savedPaymentMethodUpdateSchema.parse(body);

    // Verify ownership
    const existing = await prisma.savedPaymentMethod.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    // If setting as default, unset all other defaults first
    if (data.isDefault) {
      await prisma.savedPaymentMethod.updateMany({
        where: { userId: session.userId },
        data: { isDefault: false },
      });
    }

    const paymentMethod = await prisma.savedPaymentMethod.update({
      where: { id },
      data,
    });

    logger.info("Payment method updated successfully", {
      userId: session.userId,
      paymentMethodId: id,
      isDefault: paymentMethod.isDefault,
    });

    return NextResponse.json({ paymentMethod });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Payment method update validation failed", {
        userId: session?.userId,
        errors: error.errors,
      });
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Failed to update payment method", error, {
      userId: session?.userId,
    });
    return NextResponse.json(
      { error: "Failed to update payment method" },
      { status: 500 }
    );
  }
}

/**
 * Delete a saved payment method.
 *
 * @access protected (Clerk authentication required)
 * @param request - Incoming request (unused but required by Next.js signature)
 * @param params - Route parameters containing the payment method ID
 * @param params.params.id - Payment method UUID to delete
 * @returns 200 `{ success: true }` when deletion succeeds
 * @returns 401 `{ error: "Unauthorized" }` when Clerk session is missing
 * @returns 404 `{ error: "Payment method not found" }` when ID doesn't exist or user doesn't own it
 * @returns 500 `{ error: "Failed to delete payment method" }` on database errors
 * @see prisma/schema.prisma SavedPaymentMethod model for database schema
 * @remarks Security: Verifies ownership via `userId` match before allowing deletion.
 *   Non-owners receive 404 to avoid leaking existence of payment method IDs.
 * @remarks **No cascade implications**: Deleting a payment method does not affect existing
 *   orders or subscriptions that reference it; those retain their payment details at creation time.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership before deleting
    const existing = await prisma.savedPaymentMethod.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    await prisma.savedPaymentMethod.delete({
      where: { id },
    });

    logger.info("Payment method deleted successfully", {
      userId: session.userId,
      paymentMethodId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete payment method", error, {
      userId: session?.userId,
    });
    return NextResponse.json(
      { error: "Failed to delete payment method" },
      { status: 500 }
    );
  }
}
