import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { campaignSchema } from "@/lib/schemas";
import { isAdminUser } from "@/lib/admin-auth";

async function checkAdminAuth() {
  const user = await currentUser();
  if (!user) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const isAdmin = isAdminUser(user);
  if (!isAdmin) {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { authorized: true, user };
}

/**
 * Email marketing campaigns list endpoint.
 *
 * @access admin-only
 * @param request - Incoming request with optional query params:
 *   `page` (default: 1, min: 1) and `limit` (default: 20, min: 1, max: 100)
 * @returns 200 `{ campaigns: Campaign[], total: number, page: number, limit: number, pages: number }`
 *   with paginated campaign list ordered by creation date (newest first)
 * @returns 401 `{ error: "Unauthorized" }` when Clerk authentication fails
 * @returns 403 `{ error: "Forbidden" }` when user lacks admin role in Clerk publicMetadata
 * @throws 500 `{ error: "Failed to fetch campaigns" }` on database errors
 * @see campaignSchema in lib/schemas.ts for campaign data structure
 * @remarks Pagination bounds are automatically clamped: page ≥ 1, 1 ≤ limit ≤ 100.
 *   Returns minimal campaign fields (excludes full HTML/text content for performance).
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

    const total = await prisma.campaign.count();

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        scheduledAt: true,
        sentAt: true,
        recipientCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      campaigns,
      total,
      page,
      limit,
      pages,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

/**
 * Email campaign creation endpoint.
 *
 * @access admin-only
 * @param request - Incoming request with body validated against `campaignSchema`
 *   (subject, body, templateId?, scheduledFor?). See lib/schemas.ts for schema definition.
 * @returns 201 `{ campaign: Campaign }` with newly created campaign in draft status
 * @returns 400 `{ error: "Invalid data", details: ZodError[] }` when validation fails
 * @returns 401 `{ error: "Unauthorized" }` when Clerk authentication fails
 * @returns 403 `{ error: "Forbidden" }` when user lacks admin role in Clerk publicMetadata
 * @throws 500 `{ error: "Failed to create campaign" }` on database errors
 * @see campaignSchema in lib/schemas.ts for request body validation rules
 * @remarks Campaign is created with status: "draft", recipientCount: 0, and name derived from subject.
 *   Both htmlContent and textContent are initially set to the provided body (admin can edit later).
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const body = await request.json();
    const data = campaignSchema.parse(body);

    const campaign = await prisma.campaign.create({
      data: {
        name: data.subject,
        subject: data.subject,
        htmlContent: data.body,
        textContent: data.body,
        templateId: data.templateId || null,
        status: "draft",
        scheduledAt: data.scheduledFor || null,
        recipientCount: 0,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
