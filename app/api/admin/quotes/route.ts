import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Admin endpoint for retrieving paginated quote requests with optional filtering.
 *
 * @access restricted (admin role required)
 * @param request - Incoming request with URL search params:
 *   - `page` (optional, default 1): Page number for pagination, minimum 1
 *   - `limit` (optional, default 20, max 100): Records per page, clamped to [1, 100]
 *   - `status` (optional): Filter by quote request status
 * @returns 200 `{ quotes: QuoteRequest[], total: number, page: number, limit: number, pages: number }`
 *   with full quote request details ordered by creation date (newest first)
 * @returns 401 `{ error: "Unauthorized" }` when authentication fails or Clerk is not configured
 * @returns 403 `{ error: "Forbidden: Admin access required" }` when authenticated user lacks admin role
 * @throws 500 `{ error: "Failed to fetch quote requests" }` on database or server errors
 * @see middleware.ts — auth middleware enforces Clerk session
 * @see prisma/schema.prisma — QuoteRequest model definition
 * @remarks Requires Clerk authentication with `publicMetadata.role === "admin"`.
 *   Returns selected fields: id, name, email, phone, company, products, quantity, deliveryAddr,
 *   notes, status, createdAt, updatedAt. Page/limit parameters are sanitized to prevent
 *   excessive database load (max 100 records per request).
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

    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const status = searchParams.get("status");

    // Calculate skip and take for Prisma
    const skip = (page - 1) * limit;
    const take = limit;

    // Build where clause for filtering
    const where = status ? { status } : {};

    // Get total count for pagination metadata
    const total = await prisma.quoteRequest.count({ where });

    // Fetch paginated quote requests
    const quotes = await prisma.quoteRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        products: true,
        quantity: true,
        deliveryAddr: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Calculate total pages
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      quotes,
      total,
      page,
      limit,
      pages
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch quote requests" }, { status: 500 });
  }
}
