import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// Schema for contractor terms approval
const contractorTermsApprovalSchema = z.object({
  creditLimit: z.number().nonnegative("Credit limit must be non-negative"),
  termsLength: z.number().int().nonnegative("Terms length must be non-negative"),
});

/**
 * Admin endpoint to approve or revoke contractor net terms with credit limit and terms length.
 *
 * @access admin (requires authentication via requireAdmin())
 * @param request - Incoming request with body validated against `contractorTermsApprovalSchema`
 *   ({ creditLimit: number, termsLength: number })
 * @param params - Route parameters containing `userId` (Next.js 15 async params pattern)
 * @returns 200 `{ profile: UserProfile }` with updated net terms approval status
 * @returns 404 `{ error: "User profile not found" }` when userId doesn't exist in database
 * @throws 400 `{ error: "Invalid request data", details: ZodError[] }` when validation fails
 * @throws 403 `{ error: "Unauthorized: Admin access required" }` when admin authentication fails
 * @throws 500 `{ error: "Failed to approve contractor terms" }` on database errors
 * @see requireAdmin in lib/admin-auth.ts for admin authentication logic
 * @see UserProfile model in prisma/schema.prisma for net terms fields
 * @remarks Setting creditLimit to 0 or termsLength to 0 revokes net terms approval.
 *   The netTermsApproved flag is computed from creditLimit > 0 && termsLength > 0.
 *   Database failures during the update operation result in a 500 error response.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdmin();

    // Await params (Next.js 15 pattern)
    const { userId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = contractorTermsApprovalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { creditLimit, termsLength } = validation.data;

    // Check if user profile exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Determine if approving or revoking based on credit limit
    // If creditLimit is 0, revoke approval
    const isApproving = creditLimit > 0 && termsLength > 0;

    // Update user profile to approve or revoke net terms
    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: {
        netTermsApproved: isApproving,
        netTermsCreditLimit: creditLimit,
        netTermsLength: termsLength,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        isContractor: true,
        contractorDiscount: true,
        netTermsApproved: true,
        netTermsCreditLimit: true,
        netTermsLength: true,
        netTermsBalance: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to approve contractor terms" },
      { status: 500 }
    );
  }
}
