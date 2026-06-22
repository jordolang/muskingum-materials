import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { orderStatusUpdateSchema } from "@/lib/schemas";
import { sendOrderStatusEmail, type OrderEmailData, type OrderStatus } from "@/lib/email-service";
import { logger } from "@/lib/logger";

/**
 * Retrieve a specific order by order number for the authenticated user.
 *
 * @access authenticated (Clerk session required)
 * @param _request - Incoming request (unused, params extracted from route context)
 * @param params - Route parameters containing orderNumber (e.g., "MUS-20231201-1234")
 * @returns 200 `{ order: Order }` when order found and owned by the authenticated user
 * @returns 401 `{ error: "Unauthorized" }` when no valid Clerk session
 * @returns 404 `{ error: "Order not found" }` when order doesn't exist or belongs to another user
 * @throws 500 `{ error: "Failed to fetch order" }` on database errors
 * @see middleware.ts — Clerk auth middleware ensures session exists before route handler runs
 * @remarks User isolation enforced via Prisma query filter on `userId: session.userId`.
 *   Order numbers are globally unique but user-scoped access prevents data leaks.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderNumber } = await params;

    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        userId: session.userId,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

/**
 * Update order status with audit trail and email notification (admin-only).
 *
 * @access admin (requires Clerk session + `publicMetadata.role === 'admin'`)
 * @param request - Incoming request with body validated against `orderStatusUpdateSchema`
 *   from lib/schemas.ts ({ status: OrderStatus, statusNotes?: string })
 * @param params - Route parameters containing orderNumber (e.g., "MUS-20231201-1234")
 * @returns 200 `{ order: Order }` when status update succeeds (email failure is logged, not thrown)
 * @returns 401 `{ error: "Unauthorized" }` when no valid Clerk session
 * @returns 403 `{ error: "Forbidden: Admin access required..." }` when user lacks admin role
 * @returns 404 `{ error: "Order not found" }` when orderNumber doesn't exist
 * @throws 400 `{ error: "Invalid status data", details: ZodError[] }` when body validation fails
 * @throws 500 `{ error: "Failed to update order status" }` on database transaction errors
 * @see orderStatusUpdateSchema in lib/schemas.ts — validation schema for request body
 * @see sendOrderStatusEmail in lib/email-service.ts — Postmark-based notification
 * @see OrderStatusHistory model in prisma/schema.prisma — audit trail with changedBy field
 * @remarks Transaction ensures atomic creation of status history entry + order update.
 *   Email failures are logged but do NOT rollback the database transaction or fail the request.
 *   Admin role check uses Clerk `publicMetadata.role` — set via Clerk dashboard or API.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has admin role
    const client = await clerkClient();
    const user = await client.users.getUser(session.userId);
    const isAdmin = user.publicMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required to update order status" },
        { status: 403 }
      );
    }

    const { orderNumber } = await params;
    const body = await request.json();
    const data = orderStatusUpdateSchema.parse(body);

    // Find the order
    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order status and create status history entry in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Create status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: data.status,
          notes: data.statusNotes,
          changedBy: session.userId,
        },
      });

      // Update order status
      return await tx.order.update({
        where: { id: order.id },
        data: { status: data.status },
      });
    });

    // Send email notification
    try {
      const emailData: OrderEmailData = {
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.name,
        customerEmail: updatedOrder.email,
        customerPhone: updatedOrder.phone || undefined,
        items: updatedOrder.items as Array<{
          name: string;
          quantity: number;
          unit: string;
          price: number;
        }>,
        subtotal: updatedOrder.subtotal,
        tax: updatedOrder.tax,
        processingFee: updatedOrder.processingFee,
        deliveryFee: updatedOrder.deliveryFee || undefined,
        total: updatedOrder.total,
        pickupOrDeliver: updatedOrder.pickupOrDeliver as "pickup" | "deliver",
        deliveryAddress: updatedOrder.deliveryAddress || undefined,
        deliveryNotes: updatedOrder.deliveryNotes || undefined,
        status: updatedOrder.status as OrderStatus,
        statusNotes: data.statusNotes,
      };

      await sendOrderStatusEmail(emailData);
    } catch (emailError) {
      // Log email error but don't fail the request - order was updated successfully
      logger.error(`Failed to send status update email for order ${orderNumber}`, emailError);
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid status data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
