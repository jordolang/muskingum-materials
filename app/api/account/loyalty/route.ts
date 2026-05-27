import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * GET /api/account/loyalty
 * Returns the authenticated user's loyalty account including current points balance and transaction history
 *
 * Loyalty Program Details:
 * - Earn 1 point per $1 spent
 * - Redeem 100 points = $5 discount
 * - Tiered benefits based on annual spending
 *
 * Returns:
 * - account: LoyaltyAccount with current points balance and transactions array
 *
 * Requires authentication via Clerk session
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.loyaltyAccount.findUnique({
      where: { userId: session.userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ account });
  } catch (error) {
    logger.error("Loyalty account fetch error", error, {
      operation: "getLoyaltyAccount",
    });
    return NextResponse.json({ error: "Failed to fetch loyalty account" }, { status: 500 });
  }
}
