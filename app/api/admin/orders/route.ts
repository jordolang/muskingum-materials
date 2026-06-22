import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Admin order listing endpoint with pagination and filtering.
 *
 * @access admin
 * @param request - Incoming request with optional query parameters:
 *   - `page` (default: 1, min: 1) — page number for pagination
 *   - `limit` (default: 20, min: 1, max: 100) — items per page
 * @returns 200 `{ orders: Order[], total: number, page: number, limit: number, pages: number }`
 *   with paginated order list, total count, and metadata
 * @returns 401 `{ error: "Unauthorized" }` when Clerk session is missing or invalid
 * @returns 403 `{ error: "Forbidden: Admin access required" }` when user lacks admin role
 * @returns 500 `{ error: "Failed to fetch orders" }` on database or unexpected errors
 * @see currentUser from @clerk/nextjs/server — admin role verified via publicMetadata.role === "admin"
 * @see prisma.order.findMany — fetches orders ordered by createdAt DESC with pagination
 * @remarks Falls back to 401 when Clerk is not configured. Query params are clamped to safe ranges
 *   (page min: 1, limit min: 1, max: 100) to prevent pagination attacks. Returns all orders
 *   across all users (not filtered by userId) for admin oversight.
 */
export async function GET(request: Request) {
  try {
    // Check authentication and admin role
    let session;
    let user;

    try {
      session = await auth();
      user = await currentUser();
    } catch {
      // Clerk not configured
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const isAdmin = user?.publicMetadata?.role === "admin";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

    // Calculate skip and take for Prisma
    const skip = (page - 1) * limit;
    const take = limit;

    // Get total count for pagination metadata
    const total = await prisma.order.count();

    // Fetch paginated orders (all orders, not filtered by userId)
    const orders = await prisma.order.findMany({
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
        userId: true,
      },
    });

    // Calculate total pages
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      pages
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
