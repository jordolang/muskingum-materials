import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { updateRecurringOrderSchema } from "@/lib/schemas";
import { z } from "zod";

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
