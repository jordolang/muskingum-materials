import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { updateRecurringOrderSchema } from "@/lib/schemas";
import { z } from "zod";

/**
 * GET /api/account/recurring-orders/[id]
 * Returns a single recurring order subscription by ID for authenticated user
 * Verifies ownership before returning the order details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const recurringOrder = await prisma.recurringOrder.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!recurringOrder) {
      return NextResponse.json({ error: "Recurring order not found" }, { status: 404 });
    }

    return NextResponse.json({ recurringOrder });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch recurring order" }, { status: 500 });
  }
}

/**
 * PATCH /api/account/recurring-orders/[id]
 * Updates a recurring order subscription (validated by updateRecurringOrderSchema)
 * All fields are optional: name, email, phone, company, items, deliveryAddress, deliveryNotes, frequency, nextDeliveryDate
 * Status management: can update status to 'active', 'paused', or 'cancelled'
 * Verifies ownership before allowing update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateRecurringOrderSchema.parse(body);

    // Check if order exists and belongs to user
    const existing = await prisma.recurringOrder.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Recurring order not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.email !== undefined) updateData.email = validated.email;
    if (validated.phone !== undefined) updateData.phone = validated.phone;
    if (validated.company !== undefined) updateData.company = validated.company;
    if (validated.items !== undefined) updateData.items = validated.items;
    if (validated.deliveryAddress !== undefined) updateData.deliveryAddress = validated.deliveryAddress;
    if (validated.deliveryNotes !== undefined) updateData.deliveryNotes = validated.deliveryNotes;
    if (validated.frequency !== undefined) updateData.frequency = validated.frequency;
    if (validated.nextDeliveryDate !== undefined) updateData.nextDeliveryDate = new Date(validated.nextDeliveryDate);
    if (validated.status !== undefined) updateData.status = validated.status;

    // Update recurring order
    const recurringOrder = await prisma.recurringOrder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ recurringOrder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update recurring order" }, { status: 500 });
  }
}

/**
 * DELETE /api/account/recurring-orders/[id]
 * Permanently deletes a recurring order subscription (hard delete)
 * Verifies ownership before allowing deletion
 * Returns success confirmation on successful deletion
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if order exists and belongs to user
    const existing = await prisma.recurringOrder.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Recurring order not found" }, { status: 404 });
    }

    // Delete recurring order (hard delete)
    await prisma.recurringOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Recurring order deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete recurring order" }, { status: 500 });
  }
}
