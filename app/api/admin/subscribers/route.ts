import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin-auth";

// Schema for creating a subscriber (email required + unique; name optional; active default true)
const subscriberCreateSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().max(200).optional(),
  active: z.boolean().optional(),
});

async function checkAdminAuth() {
  const user = await currentUser();
  if (!user) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Match the rest of admin: role metadata OR the email allowlist (isAdminUser).
  if (!isAdminUser(user)) {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { authorized: true, user };
}

/**
 * Paginated newsletter subscriber listing for admin dashboard.
 *
 * @access admin (requires Clerk publicMetadata.role === "admin")
 * @param request - Incoming request with URL search params:
 *   - `page` (optional, default: 1, min: 1): Page number for pagination
 *   - `limit` (optional, default: 20, min: 1, max: 100): Items per page
 *   - `active` (optional, boolean string): Filter by subscriber active status ("true" | "false")
 * @returns 200 `{ subscribers: Array, total: number, page: number, limit: number, pages: number }` on success
 * @returns 401 `{ error: "Unauthorized" }` when user is not authenticated via Clerk
 * @returns 403 `{ error: "Forbidden" }` when authenticated user lacks admin role
 * @returns 500 `{ error: "Failed to fetch subscribers" }` on database errors
 * @see checkAdminAuth — shared admin authentication helper for this endpoint
 * @see prisma.newsletterSubscriber — source table in schema.prisma
 * @remarks Returns subscribers ordered by createdAt DESC. Query params are sanitized:
 *   page/limit are coerced to safe integers within bounds. DB failures return 500 without
 *   exposing internal error details.
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

    // Handle active filter
    const activeParam = searchParams.get("active");
    const where: { active?: boolean } = {};
    if (activeParam !== null) {
      where.active = activeParam === "true";
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const total = await prisma.newsletterSubscriber.count({ where });

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        createdAt: true,
      },
    });

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      subscribers,
      total,
      page,
      limit,
      pages,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}

/**
 * Admin-only endpoint for creating a newsletter subscriber.
 *
 * @access admin (requires Clerk publicMetadata.role === "admin")
 * @param request - Incoming request with body validated against `subscriberCreateSchema`
 *   (email required + unique; name optional; active optional, defaults to true)
 * @returns 201 `{ subscriber: NewsletterSubscriber }` on success
 * @returns 400 `{ error: string, details?: ZodError[] }` when validation or JSON parsing fails
 * @returns 401 `{ error: "Unauthorized" }` when not authenticated
 * @returns 403 `{ error: "Forbidden" }` when authenticated user lacks admin role
 * @returns 409 `{ error: string }` when a subscriber with the email already exists
 * @returns 500 `{ error: string }` on database errors
 * @see checkAdminAuth — shared admin authentication helper for this endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const validation = subscriberCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    try {
      const subscriber = await prisma.newsletterSubscriber.create({
        data: {
          email: data.email,
          name: data.name || null,
          active: data.active ?? true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          active: true,
          createdAt: true,
        },
      });

      return NextResponse.json({ subscriber }, { status: 201 });
    } catch (dbError) {
      if (
        dbError instanceof Prisma.PrismaClientKnownRequestError &&
        dbError.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "A subscriber with this email already exists." },
          { status: 409 }
        );
      }
      throw dbError;
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to create subscriber" }, { status: 500 });
  }
}
