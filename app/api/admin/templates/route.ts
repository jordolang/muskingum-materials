import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

async function checkAdminAuth() {
  const user = await currentUser();
  if (!user) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const isAdmin = user.publicMetadata?.role === "admin";
  if (!isAdmin) {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { authorized: true, user };
}

/**
 * Admin email template listing endpoint with pagination.
 *
 * @access admin
 * @param request - Incoming request with query parameters:
 *   - `page` (optional, default: 1) — 1-based page number, coerced to min(1)
 *   - `limit` (optional, default: 20, max: 100) — items per page, clamped to [1, 100]
 * @returns 200 `{ templates: EmailTemplate[], total: number, page: number, limit: number, pages: number }`
 *   where `EmailTemplate` includes id, name, subject, category, active, createdAt, updatedAt
 * @returns 401 `{ error: "Unauthorized" }` when Clerk authentication fails
 * @returns 403 `{ error: "Forbidden" }` when user lacks admin role
 * @returns 500 `{ error: "Failed to fetch templates" }` on database errors
 * @see checkAdminAuth — admin role validation via Clerk publicMetadata
 * @see prisma/schema.prisma — EmailTemplate model definition
 * @remarks Query parameters are sanitized: page uses Math.max(1, ...) to prevent negative/zero values;
 *   limit uses Math.min(100, Math.max(1, ...)) to clamp to [1, 100]. Invalid numeric inputs fall back to defaults.
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

    const skip = (page - 1) * limit;
    const take = limit;

    const total = await prisma.emailTemplate.count();

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        name: true,
        subject: true,
        category: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      templates,
      total,
      page,
      limit,
      pages,
    });
  } catch (error) {
    logger.error("Admin templates API error", error, {
      operation: "templates.GET",
    });
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
