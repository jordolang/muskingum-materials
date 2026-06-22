import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Update saved order template endpoint.
 *
 * @access protected
 * @param request - Incoming request with optional body fields (name, items, deliveryAddress, pickupOrDeliver)
 * @param params - Route parameters containing the saved order ID
 * @returns 200 `{ savedOrder: SavedOrder }` on successful update
 * @returns 401 `{ error: "Unauthorized" }` when not authenticated
 * @returns 404 `{ error: "Saved order not found" }` when order doesn't exist or doesn't belong to user
 * @throws 500 `{ error: "Failed to update saved order" }` on database errors
 * @see SavedOrder model in prisma/schema.prisma
 * @remarks Requires Clerk authentication. Only the order owner can update their saved templates.
 *   All body fields are optional — only provided fields will be updated.
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
    logger.error("Saved order update error", error, {
      operation: "updateSavedOrder",
    });
    return NextResponse.json({ error: "Failed to update saved order" }, { status: 500 });
  }
}

/**
 * Delete saved order template endpoint.
 *
 * @access protected
 * @param _request - Incoming request (unused)
 * @param params - Route parameters containing the saved order ID
 * @returns 200 `{ success: true }` on successful deletion
 * @returns 401 `{ error: "Unauthorized" }` when not authenticated
 * @returns 404 `{ error: "Saved order not found" }` when order doesn't exist or doesn't belong to user
 * @throws 500 `{ error: "Failed to delete saved order" }` on database errors
 * @see SavedOrder model in prisma/schema.prisma
 * @remarks Requires Clerk authentication. Only the order owner can delete their saved templates.
 *   Deletion is permanent and cannot be undone.
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
    logger.error("Saved order deletion error", error, {
      operation: "deleteSavedOrder",
    });
    return NextResponse.json({ error: "Failed to delete saved order" }, { status: 500 });
  }
}
