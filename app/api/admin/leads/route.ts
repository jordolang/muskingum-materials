import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Admin endpoint for retrieving paginated lead submissions with optional filtering.
 *
 * @access admin-only (requires Clerk authentication with publicMetadata.role === "admin")
 * @param request - Incoming request with optional query parameters:
 *   - `page` (number, optional, default: 1): Page number for pagination (min: 1)
 *   - `limit` (number, optional, default: 20): Results per page (min: 1, max: 100)
 *   - `source` (string, optional): Filter leads by source field (e.g., "contact_form", "chat", "quote_request")
 * @returns 200 `{ leads: Lead[], total: number, page: number, limit: number, pages: number }` on success
 * @returns 401 `{ error: "Unauthorized" }` when Clerk authentication fails or session is missing
 * @returns 403 `{ error: "Forbidden: Admin access required" }` when authenticated user lacks admin role
 * @throws 500 `{ error: "Failed to fetch leads" }` on database query failure or unexpected errors
 * @see Lead model in prisma/schema.prisma for full lead schema
 * @see middleware.ts for Clerk authentication flow
 * @remarks
 * - Authentication: Checks Clerk session userId AND user.publicMetadata.role === "admin"
 * - Pagination: Uses Prisma skip/take with calculated offset (page-1)*limit
 * - Filtering: Optional `source` filter applied via Prisma where clause
 * - Sorting: Results ordered by createdAt DESC (newest first)
 * - Response includes pagination metadata (total count, current page, total pages)
 * - Page numbers are 1-indexed (page=1 is first page)
 * - Limit is clamped to [1, 100] to prevent excessive DB load
 * - When Clerk is not configured, returns 401 without throwing exceptions
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
    const source = searchParams.get("source");

    // Calculate skip and take for Prisma
    const skip = (page - 1) * limit;
    const take = limit;

    // Build where clause for filtering
    const where = source ? { source } : {};

    // Get total count for pagination metadata
    const total = await prisma.lead.count({ where });

    // Fetch paginated leads
    const leads = await prisma.lead.findMany({
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
        message: true,
        source: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Calculate total pages
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      leads,
      total,
      page,
      limit,
      pages
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
