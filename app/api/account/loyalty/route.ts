import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Loyalty account and transaction history retrieval endpoint.
 *
 * @access authenticated
 * @returns 200 `{ account: LoyaltyAccount | null }` with account details including
 *   points balance and transaction history (ordered by createdAt desc), or null if
 *   no loyalty account exists for the user
 * @returns 401 `{ error: "Unauthorized" }` when Clerk session is missing or invalid
 * @returns 500 `{ error: "Failed to fetch loyalty account" }` when database query fails
 * @see auth from @clerk/nextjs/server for session verification
 * @see prisma.loyaltyAccount for schema definition
 * @see lib/logger.ts for error logging conventions
 * @remarks **Loyalty Program Details:**
 *   - Earn 1 point per $1 spent on orders
 *   - Redeem 100 points = $5 discount on next purchase
 *   - Tiered benefits unlock based on annual spending
 *   - Transactions include both points earned (order completions) and points redeemed
 *   - DB query failures are logged with operation context but do not expose internal
 *     error details to the client
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
