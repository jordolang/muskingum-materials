import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { pointRedemptionSchema } from "@/lib/schemas";
import { canRedeemPoints, calculateDiscountForPoints } from "@/lib/loyalty";
import { logger } from "@/lib/logger";

/**
 * Redeem loyalty points for a discount coupon.
 *
 * @access authenticated
 * @param request - Incoming request with body validated against `pointRedemptionSchema`
 *   (points: number min 100 in multiples of 100; notes: string optional).
 *   See lib/schemas.ts for shared schema conventions.
 * @returns 200 `{ success: true, account: LoyaltyAccount, transaction: LoyaltyTransaction, discountAmount: number }`
 *   with updated points balance and redemption transaction record
 * @returns 401 `{ error: "Unauthorized" }` when Clerk session is missing
 * @returns 404 `{ error: "Loyalty account not found" }` when user has no loyalty account
 * @returns 400 `{ error: "Points must be at least 100 and in multiples of 100" }` when redemption amount is invalid
 * @returns 400 `{ error: "Insufficient points balance" }` when user doesn't have enough points
 * @throws 400 `{ error: "Invalid data", details: ZodError[] }` when request validation fails
 * @throws 500 `{ error: "Failed to redeem points" }` on database transaction failure
 * @see pointRedemptionSchema in lib/schemas.ts for request validation
 * @see canRedeemPoints in lib/loyalty.ts — validates minimum 100 points in multiples of 100
 * @see calculateDiscountForPoints in lib/loyalty.ts — conversion rate: 100 points = $5 discount
 * @see prisma.$transaction — atomic points deduction + transaction record creation
 * @remarks Redemption rules: 100 points = $5 discount, minimum 100 points, multiples of 100 only.
 *   Uses database transaction to ensure atomicity between points deduction and transaction logging.
 *   Requires authenticated Clerk session with valid userId.
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
