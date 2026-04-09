import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { orderStatusUpdateSchema } from "@/lib/schemas";
import { sendOrderStatusEmail, type OrderEmailData, type OrderStatus } from "@/lib/email/order-notifications";

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
      console.error(`Failed to send status update email for order ${orderNumber}:`, emailError);
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
