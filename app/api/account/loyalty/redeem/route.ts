import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { pointRedemptionSchema } from "@/lib/schemas";
import { canRedeemPoints, calculateDiscountForPoints } from "@/lib/loyalty";
import { logger } from "@/lib/logger";

/**
 * POST /api/account/loyalty/redeem
 * Redeems loyalty points for a discount amount
 *
 * Body validation: pointRedemptionSchema
 * - points: number (required) - Must be at least 100 and in multiples of 100
 * - notes: string (optional) - Additional notes for the redemption
 *
 * Redemption Rules:
 * - 100 points = $5 discount
 * - Minimum redemption: 100 points
 * - Points must be redeemed in multiples of 100
 * - User must have sufficient points balance
 *
 * Returns:
 * - success: boolean
 * - account: Updated LoyaltyAccount with new points balance
 * - transaction: LoyaltyTransaction record of the redemption
 * - discountAmount: Dollar value of the discount
 *
 * Uses database transaction to ensure atomicity (points deduction + transaction record creation)
 * Requires authentication via Clerk session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = pointRedemptionSchema.parse(body);

    // Validate points are redeemable (minimum 100, in multiples of 100)
    if (!canRedeemPoints(data.points)) {
      return NextResponse.json(
        { error: "Points must be at least 100 and in multiples of 100" },
        { status: 400 }
      );
    }

    // Get or create loyalty account
    const account = await prisma.loyaltyAccount.findUnique({
      where: { userId: session.userId },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Loyalty account not found" },
        { status: 404 }
      );
    }

    // Check if user has enough points
    if (account.points < data.points) {
      return NextResponse.json(
        { error: "Insufficient points balance" },
        { status: 400 }
      );
    }

    // Calculate discount value
    const discountAmount = calculateDiscountForPoints(data.points);

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Deduct points from account
      const updatedAccount = await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: {
            decrement: data.points,
          },
        },
      });

      // Create redemption transaction record
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: "redemption",
          points: -data.points,
          description: `Redeemed ${data.points} points for $${discountAmount.toFixed(2)} discount${data.notes ? `: ${data.notes}` : ""}`,
        },
      });

      return { account: updatedAccount, transaction };
    });

    return NextResponse.json({
      success: true,
      account: result.account,
      transaction: result.transaction,
      discountAmount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Point redemption error", error, {
      operation: "redeemLoyaltyPoints",
    });
    return NextResponse.json(
      { error: "Failed to redeem points" },
      { status: 500 }
    );
  }
}
