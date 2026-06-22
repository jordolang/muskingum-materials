import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Retrieves all saved order templates for the authenticated user.
 *
 * @access authenticated - Requires Clerk session
 * @returns 200 `{ savedOrders: SavedOrder[] }` with array of saved order templates
 *   ordered by creation date (newest first)
 * @returns 401 `{ error: "Unauthorized" }` when user is not authenticated
 * @throws 500 `{ error: "Failed to fetch saved orders" }` when database query fails
 * @see auth() from @clerk/nextjs/server for authentication mechanism
 * @see SavedOrder model in prisma/schema.prisma for full field definitions
 * @remarks Returned SavedOrder objects include: id, userId, name, items (JSON),
 *   deliveryAddress, pickupOrDeliver, createdAt, updatedAt.
 *   DB failures are logged but do not expose internal details to client.
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
 * Creates a new saved order template for the authenticated user.
 *
 * @access authenticated - Requires Clerk session
 * @param request - Incoming request with JSON body:
 *   `{ name: string, items: any, deliveryAddress?: string, pickupOrDeliver?: "pickup" | "deliver" }`
 *   - name: Display name for the saved order template (required)
 *   - items: Cart items data structure (required, stored as JSON)
 *   - deliveryAddress: Optional delivery address string
 *   - pickupOrDeliver: Order fulfillment method, defaults to "pickup"
 * @returns 201 `{ savedOrder: SavedOrder }` with newly created saved order template
 * @returns 401 `{ error: "Unauthorized" }` when user is not authenticated
 * @returns 400 `{ error: "Name and items are required" }` when required fields are missing
 * @throws 500 `{ error: "Failed to create saved order" }` when database insert fails
 * @see auth() from @clerk/nextjs/server for authentication mechanism
 * @see SavedOrder model in prisma/schema.prisma for schema definition
 * @remarks No explicit Zod validation is performed; validation relies on null checks
 *   for required fields (name, items). The pickupOrDeliver field defaults to "pickup"
 *   if not provided. deliveryAddress defaults to null. DB failures are logged but
 *   do not expose internal details to client.
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
