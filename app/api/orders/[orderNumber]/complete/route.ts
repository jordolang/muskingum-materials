import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Mark an order as completed and set the completion timestamp.
 *
 * @access public (⚠️ No authentication — should be restricted to admin/staff in production)
 * @param request - Incoming POST request (body not required for this endpoint)
 * @param params - Route parameters containing `orderNumber` extracted from URL path `[orderNumber]`
 * @returns 200 `{ success: true, order: { orderNumber: string, status: string, completedAt: Date } }` when order successfully marked complete
 * @returns 404 `{ error: "Order not found" }` when orderNumber does not match any existing order
 * @returns 500 `{ error: "Internal server error" }` on database failures or unexpected errors
 * @see Order model in prisma/schema.prisma for status enum values and completedAt timestamp field
 * @remarks ⚠️ SECURITY: This endpoint has no authentication or authorization checks — any client can mark any order complete.
 *   Production deployments should implement admin authentication or order ownership validation to prevent unauthorized status changes.
 *   Updates order.status to "completed" and sets order.completedAt to current timestamp atomically.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    // Verify the order exists
    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order status to completed
    const updatedOrder = await prisma.order.update({
      where: { orderNumber },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        completedAt: updatedOrder.completedAt,
      },
    });
  } catch (error) {
    logger.error("Error completing order", error, {
      operation: "completeOrder",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
