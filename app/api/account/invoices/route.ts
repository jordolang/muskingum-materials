import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * GET /api/account/invoices
 * Fetches invoices for the authenticated user
 *
 * Auth: Requires Clerk authentication
 * Query params:
 *   - status: optional filter by status (pending|paid|overdue)
 *   - limit: optional limit number of results (default: 50)
 *   - offset: optional offset for pagination (default: 0)
 * Returns: { invoices: Invoice[], total: number }
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
