import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { releaseSlot, bookSlot, isSlotAvailable } from "@/lib/delivery-scheduling";

// Schema for order updates
const orderUpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "ready", "completed", "canceled"]).optional(),
  deliveryDate: z.string().datetime().optional(),
  deliveryTimeWindow: z.string().optional(),
});

/**
 * PATCH /api/admin/orders/[id] — admin endpoint for updating order status and
 * rescheduling delivery.
 *
 * @access admin
 * @param request - Incoming request with body validated against `orderUpdateSchema`
 *   (status enum: pending, confirmed, processing, ready, completed, canceled;
 *   optional deliveryDate and deliveryTimeWindow for rescheduling)
 * @param params - Route parameters containing the order ID to update
 * @returns 200 `{ order: Order }` with updated order details on success
 * @returns 400 `{ error: string, details: ZodError[] }` when validation fails
 * @returns 403 `{ error: string }` when admin authentication fails
 * @returns 404 `{ error: string }` when order ID does not exist
 * @returns 500 `{ error: string }` on database or unexpected errors
 * @throws 400 when request body fails Zod validation (invalid status value)
 * @see requireAdmin in lib/admin-auth.ts for authentication implementation
 * @see orderStatusUpdateSchema in lib/schemas.ts for shared order status validation
 * @remarks Next.js 15 pattern: params is a Promise and must be awaited before use.
 *   Order existence is verified before update to provide clear 404 responses.
 * @remarks Rescheduling behavior: both deliveryDate and deliveryTimeWindow must be
 *   provided together; the old delivery slot (if any) is released, the new slot is
 *   validated and booked, and the order is updated with the new delivery details
 *   and slot ID.
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
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { status, deliveryDate, deliveryTimeWindow } = validation.data;

    // Validate that deliveryDate and deliveryTimeWindow are provided together
    if ((deliveryDate && !deliveryTimeWindow) || (!deliveryDate && deliveryTimeWindow)) {
      return NextResponse.json(
        { error: "Both deliveryDate and deliveryTimeWindow must be provided together" },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        deliveryDate: true,
        deliveryTimeWindow: true,
        scheduledSlotId: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      status?: string;
      deliveryDate?: Date;
      deliveryTimeWindow?: string;
      scheduledSlotId?: string;
    } = {};

    // Handle status update
    if (status !== undefined) {
      updateData.status = status;
    }

    // Handle delivery rescheduling
    if (deliveryDate && deliveryTimeWindow) {
      const newDeliveryDate = new Date(deliveryDate);

      // Validate that the new slot is available
      const slotAvailable = await isSlotAvailable(newDeliveryDate, deliveryTimeWindow);
      if (!slotAvailable) {
        return NextResponse.json(
          { error: `Delivery slot ${deliveryDate} ${deliveryTimeWindow} is not available` },
          { status: 409 }
        );
      }

      // Release old slot if order has one
      if (existingOrder.deliveryDate && existingOrder.deliveryTimeWindow) {
        await releaseSlot(id);
      }

      // Book new slot
      const newSlotId = await bookSlot(id, newDeliveryDate, deliveryTimeWindow);

      // Add delivery fields to update data
      updateData.deliveryDate = newDeliveryDate;
      updateData.deliveryTimeWindow = deliveryTimeWindow;
      updateData.scheduledSlotId = newSlotId;
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
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
        deliveryDate: true,
        deliveryTimeWindow: true,
        scheduledSlotId: true,
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

    if (error instanceof Error && error.message.includes("not available")) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
