import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAdminUser } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

// Schema for creating a quote request (name + email required; rest optional).
// products and project* fields are not editable here; create sets products: [].
const quoteCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Valid email is required"),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  quantity: z.string().optional(),
  deliveryAddr: z.string().optional(),
  notes: z.string().optional(),
  status: z
    .enum(["pending", "contacted", "quoted", "accepted", "rejected"])
    .optional(),
});

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
    } catch (authError) {
      logger.error("Authentication error in admin quotes endpoint", authError, {
        operation: "admin.quotes.auth",
        endpoint: "/api/admin/quotes",
      });
      // Clerk not configured
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const isAdmin = isAdminUser(user);
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
    logger.error("Admin quotes API error", error, {
      operation: "admin.quotes.GET",
    });
    return NextResponse.json({ error: "Failed to fetch quote requests" }, { status: 500 });
  }
}

/**
 * Admin-only endpoint for creating a new quote request.
 *
 * @access admin
 * @param request - Incoming request with body validated against `quoteCreateSchema`
 *   (name + email required; phone, company, quantity, deliveryAddr, notes, status optional).
 *   `products` is set to an empty array; project* fields are not editable here.
 * @returns 201 `{ quote: QuoteRequest }` with the created quote request on success
 * @returns 400 `{ error: string, details?: ZodError[] }` when validation or JSON parsing fails
 * @returns 403 `{ error: string }` when admin authentication fails
 * @returns 500 `{ error: string }` on database or server errors
 * @see requireAdmin in lib/admin-auth.ts for authentication implementation
 */
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    await requireAdmin();

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const validation = quoteCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const quote = await prisma.quoteRequest.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        products: [],
        quantity: data.quantity || null,
        deliveryAddr: data.deliveryAddr || null,
        notes: data.notes || null,
        status: data.status || "pending",
      },
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

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    logger.error("Admin quote create error", error, {
      operation: "admin.quotes.POST",
    });
    return NextResponse.json(
      { error: "Failed to create quote request" },
      { status: 500 }
    );
  }
}
