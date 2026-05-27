import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * POST /api/orders/[orderNumber]/complete
 * Completes an order and updates its status to "completed"
 * Sets completedAt timestamp and verifies order exists before updating
 * Auth: No authentication required (consider adding for production)
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
