import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const restockNotifySchema = z.object({
  email: z.string().email(),
  productId: z.string().min(1),
});

/**
 * Product restock notification subscription endpoint.
 *
 * @access public
 * @param request - Incoming request with body validated against the local `restockNotifySchema`
 *   (email, productId). Email must be valid format; productId must reference an existing product.
 * @returns 201 `{ success: true }` when subscription is created successfully
 * @returns 400 `{ error: "Invalid request data", details: ZodError[] }` when validation fails
 * @throws 500 `{ error: "Failed to save notification request. Please try again." }` when database operation fails
 * @see restockNotifySchema - Zod schema enforcing email format and productId presence
 * @see RestockNotification model in prisma/schema.prisma
 * @remarks Subscriptions are stored in the RestockNotification table and trigger email
 *   notifications when the product returns to stock. Duplicate subscriptions for the same
 *   email/product combination are allowed (no unique constraint).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = restockNotifySchema.parse(body);

    await prisma.restockNotification.create({
      data: {
        email: data.email,
        productId: data.productId,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    logger.error("Restock notification error", error, {
      operation: "createRestockNotification",
    });

    return NextResponse.json(
      { error: "Failed to save notification request. Please try again." },
      { status: 500 }
    );
  }
}
