import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { savedPaymentMethodUpdateSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

/**
 * GET /api/account/payment-methods/[id]
 * Fetches a specific saved payment method for the authenticated user
 *
 * Auth: Requires Clerk authentication and ownership of the payment method
 * Returns: { paymentMethod: SavedPaymentMethod }
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
 * PATCH /api/account/payment-methods/[id]
 * Updates a saved payment method for the authenticated user
 *
 * Auth: Requires Clerk authentication and ownership of the payment method
 * Request body: savedPaymentMethodUpdateSchema (currently only isDefault)
 * Returns: { paymentMethod: SavedPaymentMethod }
 *
 * Note: If isDefault is set to true, all other payment methods are set to isDefault: false
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
 * DELETE /api/account/payment-methods/[id]
 * Deletes a saved payment method for the authenticated user
 *
 * Auth: Requires Clerk authentication and ownership of the payment method
 * Returns: { success: true }
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
