import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// Schema for contractor terms approval
const contractorTermsApprovalSchema = z.object({
  creditLimit: z.number().positive("Credit limit must be positive"),
  termsLength: z.number().int().positive("Terms length must be a positive integer"),
});

/**
 * POST /api/admin/contractors/[userId]/approve-terms
 * Admin endpoint - approves contractor for net terms with credit limit and terms length
 * Requires: Admin authentication via requireAdmin()
 * Body: { creditLimit, termsLength } - validated via contractorTermsApprovalSchema
 * Returns: Updated user profile with net terms approved
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

    // Update user profile to approve net terms
    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: {
        netTermsApproved: true,
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
