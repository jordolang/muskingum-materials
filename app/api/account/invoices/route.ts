import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Contractor invoice listing endpoint with pagination and filtering.
 *
 * @access authenticated (Clerk userId required)
 * @param request - Incoming request with query params:
 *   - `status` (optional): Filter by invoice status (pending|paid|overdue)
 *   - `limit` (optional): Maximum number of invoices to return (default: 50, validated as integer)
 *   - `offset` (optional): Number of invoices to skip for pagination (default: 0, validated as integer)
 * @returns 200 `{ invoices: Invoice[], total: number }` with full invoice records including nested order details
 *   (order.id, order.orderNumber, order.items, order.total, order.createdAt)
 * @returns 401 `{ error: "Unauthorized" }` when Clerk session is missing or userId is not present
 * @throws 500 `{ error: "Failed to fetch invoices" }` on database query failures or unexpected errors
 * @see Invoice model in prisma/schema.prisma for full record structure
 * @see Order model in prisma/schema.prisma for nested order details
 * @remarks Invoices are scoped to the authenticated user via `order.userId` join.
 *   Results are ordered by `dueDate DESC`. The `total` count respects status filtering but ignores pagination.
 *   Database errors are logged but do not expose internal details to the client.
 *   No rate limiting is applied (authenticated endpoints are assumed to be protected by Clerk session limits).
 */
export async function GET(request: NextRequest) {
  let session;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build where clause
    const where = {
      order: {
        userId: session.userId,
      },
      ...(status && { status }),
    };

    // Fetch invoices with order details
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              items: true,
              total: true,
              createdAt: true,
            },
          },
        },
        orderBy: { dueDate: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.invoice.count({ where }),
    ]);

    logger.info("Invoices fetched successfully", {
      userId: session.userId,
      count: invoices.length,
      total,
      status,
    });

    return NextResponse.json({ invoices, total });
  } catch (error) {
    logger.error("Failed to fetch invoices", error, {
      userId: session?.userId,
    });
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
