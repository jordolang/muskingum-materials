import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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

    // Check if saved order exists and belongs to user
    const existingSavedOrder = await prisma.savedOrder.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existingSavedOrder) {
      return NextResponse.json({ error: "Saved order not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, items, deliveryAddress, pickupOrDeliver } = body;

    // Update saved order
    const savedOrder = await prisma.savedOrder.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(items !== undefined && { items }),
        ...(deliveryAddress !== undefined && { deliveryAddress }),
        ...(pickupOrDeliver !== undefined && { pickupOrDeliver }),
      },
    });

    return NextResponse.json({ savedOrder });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update saved order" }, { status: 500 });
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

    // Check if saved order exists and belongs to user
    const existingSavedOrder = await prisma.savedOrder.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existingSavedOrder) {
      return NextResponse.json({ error: "Saved order not found" }, { status: 404 });
    }

    // Delete saved order
    await prisma.savedOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete saved order" }, { status: 500 });
  }
}
