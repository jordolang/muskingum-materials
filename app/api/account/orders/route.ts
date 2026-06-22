import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Authenticated user's order history endpoint with pagination support.
 *
 * @access protected - requires Clerk authentication
 * @param request - Incoming request with optional query params: `page` (default: 1), `limit` (default: 20, max: 100)
 * @returns 200 `{ orders: Order[], total: number, page: number, limit: number, pages: number }` on success
 * @returns 401 `{ error: "Unauthorized" }` when not authenticated
 * @throws 500 `{ error: "Failed to fetch orders" }` when database query fails
 * @see auth() from @clerk/nextjs/server for authentication implementation
 * @remarks Pagination: page/limit clamped to safe bounds (page ≥ 1, 1 ≤ limit ≤ 100).
 *   Orders sorted by createdAt DESC. Only returns orders owned by the authenticated user.
 *   Response includes full order details: orderNumber, items, pricing breakdown (subtotal, tax, processingFee, deliveryFee),
 *   delivery method, status, and payment status.
 */
export async function GET(request: Request) {
  let session;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

    // Calculate skip and take for Prisma
    const skip = (page - 1) * limit;
    const take = limit;

    // Get total count for pagination metadata
    const total = await prisma.order.count({
      where: { userId: session.userId },
    });

    // Fetch paginated orders
    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        orderNumber: true,
        items: true,
        subtotal: true,
        tax: true,
        processingFee: true,
        deliveryFee: true,
        total: true,
        pickupOrDeliver: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    // Calculate total pages
    const pages = Math.ceil(total / limit);

    logger.info("Orders fetched successfully", {
      userId: session.userId,
      page,
      limit,
      total,
      orderCount: orders.length,
    });

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      pages
    });
  } catch (error) {
    logger.error("Failed to fetch user orders", error, {
      userId: session?.userId,
    });
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
