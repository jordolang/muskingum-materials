import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

interface CreditLimitValidationResult {
  allowed: boolean;
  currentBalance: number;
  creditLimit: number;
  availableCredit: number;
  newBalance: number;
  errorMessage?: string;
}

/**
 * Validates whether a contractor can place an order on net terms without exceeding their credit limit.
 *
 * This function:
 * - Fetches the contractor's current net terms balance and credit limit
 * - Calculates the projected balance after the new order
 * - Returns whether the order would exceed the credit limit
 *
 * @param userId - Clerk user ID of the contractor
 * @param orderAmount - Total amount of the new order
 * @returns Validation result with balance and limit information
 *
 * @example
 * ```ts
 * const validation = await validateCreditLimit("user_123", 500.00);
 * if (!validation.allowed) {
 *   throw new Error(validation.errorMessage);
 * }
 * ```
 */
export async function validateCreditLimit(
  userId: string,
  orderAmount: number
): Promise<CreditLimitValidationResult> {
  // Fetch contractor profile with net terms approval and balance
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      netTermsApproved: true,
      netTermsCreditLimit: true,
      netTermsBalance: true,
    },
  });

  // If profile doesn't exist or net terms not approved
  if (!profile || !profile.netTermsApproved) {
    logger.warn("Credit limit validation failed: net terms not approved", {
      userId,
      orderAmount,
      profileExists: !!profile,
      netTermsApproved: profile?.netTermsApproved || false,
    });

    return {
      allowed: false,
      currentBalance: 0,
      creditLimit: 0,
      availableCredit: 0,
      newBalance: 0,
      errorMessage: "Net terms are not approved for this account",
    };
  }

  const currentBalance = profile.netTermsBalance || 0;
  const creditLimit = profile.netTermsCreditLimit || 0;
  const availableCredit = creditLimit - currentBalance;
  const newBalance = currentBalance + orderAmount;

  // Check if new order would exceed credit limit
  if (newBalance > creditLimit) {
    logger.warn("Credit limit validation failed: would exceed limit", {
      userId,
      orderAmount,
      currentBalance,
      creditLimit,
      availableCredit,
      newBalance,
    });

    return {
      allowed: false,
      currentBalance,
      creditLimit,
      availableCredit,
      newBalance,
      errorMessage: `Order amount ($${orderAmount.toFixed(
        2
      )}) would exceed available credit ($${availableCredit.toFixed(
        2
      )}). Current balance: $${currentBalance.toFixed(
        2
      )}, Credit limit: $${creditLimit.toFixed(2)}`,
    };
  }

  logger.info("Credit limit validation passed", {
    userId,
    orderAmount,
    currentBalance,
    creditLimit,
    availableCredit,
    newBalance,
  });

  return {
    allowed: true,
    currentBalance,
    creditLimit,
    availableCredit,
    newBalance,
  };
}
