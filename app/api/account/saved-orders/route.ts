import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * GET /api/account/saved-orders
 * Retrieves all saved order templates for the authenticated user
 * Returns: Array of saved orders with items, delivery info, and metadata
 * Auth: Requires Clerk authentication
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const savedOrders = await prisma.savedOrder.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        name: true,
        items: true,
        deliveryAddress: true,
        pickupOrDeliver: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ savedOrders });
  } catch (error) {
    logger.error("Saved orders fetch error", error, {
      operation: "getSavedOrders",
    });
    return NextResponse.json({ error: "Failed to fetch saved orders" }, { status: 500 });
  }
}

/**
 * POST /api/account/saved-orders
 * Creates a new saved order template for the authenticated user
 * Request body: { name: string, items: any, deliveryAddress?: string, pickupOrDeliver?: "pickup" | "deliver" }
 * Returns: Created saved order object
 * Auth: Requires Clerk authentication
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, items, deliveryAddress, pickupOrDeliver } = body;

    if (!name || !items) {
      return NextResponse.json(
        { error: "Name and items are required" },
        { status: 400 }
      );
    }

    const savedOrder = await prisma.savedOrder.create({
      data: {
        userId: session.userId,
        name,
        items,
        deliveryAddress: deliveryAddress || null,
        pickupOrDeliver: pickupOrDeliver || "pickup",
      },
    });

    return NextResponse.json({ savedOrder }, { status: 201 });
  } catch (error) {
    logger.error("Saved order creation error", error, {
      operation: "createSavedOrder",
    });
    return NextResponse.json({ error: "Failed to create saved order" }, { status: 500 });
  }
}
