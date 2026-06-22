import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// Schema for order status update
const orderUpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "ready", "completed", "canceled"]),
});

/**
 * Admin endpoint for updating order status.
 *
 * @access admin
 * @param request - Incoming request with body validated against `orderUpdateSchema`
 *   (status enum: pending, confirmed, processing, ready, completed, canceled)
 * @param params - Route parameters containing the order ID to update
 * @returns 200 `{ order: Order }` with updated order details on success
 * @returns 400 `{ error: string, details: ZodError[] }` when status validation fails
 * @returns 403 `{ error: string }` when admin authentication fails
 * @returns 404 `{ error: string }` when order ID does not exist
 * @returns 500 `{ error: string }` on database or unexpected errors
 * @throws 400 when request body fails Zod validation (invalid status value)
 * @see requireAdmin in lib/admin-auth.ts for authentication implementation
 * @see orderStatusUpdateSchema in lib/schemas.ts for shared order status validation
 * @remarks Next.js 15 pattern: params is a Promise and must be awaited before use.
 *   Order existence is verified before update to provide clear 404 responses.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdmin();

    // Await params (Next.js 15 pattern)
    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = orderUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid status value", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        name: true,
        email: true,
        phone: true,
        items: true,
        subtotal: true,
        tax: true,
        processingFee: true,
        deliveryFee: true,
        total: true,
        deliveryAddress: true,
        deliveryNotes: true,
        pickupOrDeliver: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
