import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createRecurringOrderSchema } from "@/lib/schemas";
import { z } from "zod";

/**
 * List recurring order subscriptions for authenticated user with pagination.
 *
 * @access authenticated - Requires valid Clerk session
 * @param request - Incoming request with optional query params:
 *   - `page` (default: 1): Page number for pagination (min: 1)
 *   - `limit` (default: 20, max: 100): Number of results per page
 * @returns 200 `{ recurringOrders: RecurringOrder[], total: number, page: number, limit: number, pages: number }`
 *   with recurringOrders ordered by createdAt desc. Each recurring order includes:
 *   id, name, email, phone, company, items, deliveryAddress, deliveryNotes,
 *   frequency (daily | weekly | biweekly | monthly), nextDeliveryDate,
 *   status (active | paused | cancelled), createdAt
 * @returns 401 `{ error: "Unauthorized" }` when session is missing or invalid
 * @returns 500 `{ error: "Failed to fetch recurring orders" }` on database errors
 * @see prisma/schema.prisma RecurringOrder model for field definitions
 * @remarks Query params are sanitized: page forced to >= 1, limit clamped to 1-100 range.
 *   Total count and pages calculated for client-side pagination UI.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
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
    const total = await prisma.recurringOrder.count({
      where: { userId: session.userId },
    });

    // Fetch paginated recurring orders
    const recurringOrders = await prisma.recurringOrder.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        items: true,
        deliveryAddress: true,
        deliveryNotes: true,
        frequency: true,
        nextDeliveryDate: true,
        status: true,
        createdAt: true,
      },
    });

    // Calculate total pages
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      recurringOrders,
      total,
      page,
      limit,
      pages
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch recurring orders" }, { status: 500 });
  }
}

/**
 * Create a new recurring order subscription for authenticated user.
 *
 * @access authenticated - Requires valid Clerk session
 * @param request - Incoming request with JSON body validated against `createRecurringOrderSchema`:
 *   - `name` (required): Customer contact name
 *   - `email` (required): Contact email address
 *   - `phone` (required): Contact phone number
 *   - `company` (optional): Company name if applicable
 *   - `items` (required): JSON array of ordered items with product details
 *   - `deliveryAddress` (required): Full delivery address object
 *   - `deliveryNotes` (optional): Special delivery instructions
 *   - `frequency` (required): Delivery frequency (daily | weekly | biweekly | monthly)
 *   - `nextDeliveryDate` (required): ISO 8601 date string for first delivery
 * @returns 201 `{ recurringOrder: RecurringOrder }` with newly created subscription.
 *   Status is initialized as 'active' and userId is set from authenticated session
 * @returns 401 `{ error: "Unauthorized" }` when session is missing or invalid
 * @throws 400 `{ error: "Validation failed", details: ZodError[] }` when request body fails schema validation
 * @returns 500 `{ error: "Failed to create recurring order" }` on database errors
 * @see createRecurringOrderSchema in lib/schemas.ts for complete validation rules
 * @see prisma/schema.prisma RecurringOrder model for field definitions and constraints
 * @remarks Recurring orders enable customers to schedule automatic repeat deliveries.
 *   The subscription remains active until explicitly paused or cancelled via the
 *   PATCH /api/account/recurring-orders/:id endpoint.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createRecurringOrderSchema.parse(body);

    // Create recurring order in database
    const recurringOrder = await prisma.recurringOrder.create({
      data: {
        userId: session.userId,
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        company: validated.company || null,
        items: validated.items,
        deliveryAddress: validated.deliveryAddress,
        deliveryNotes: validated.deliveryNotes || null,
        frequency: validated.frequency,
        nextDeliveryDate: new Date(validated.nextDeliveryDate),
        status: 'active',
      },
    });

    return NextResponse.json({ recurringOrder }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create recurring order" }, { status: 500 });
  }
}
