import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Admin endpoint for retrieving paginated chat conversations with message counts.
 *
 * @access admin - Requires Clerk authentication with `publicMetadata.role === "admin"`
 * @param request - Incoming request with optional query parameters:
 *   - `page` (number, default: 1): Page number for pagination (min: 1)
 *   - `limit` (number, default: 20, max: 100): Results per page (clamped to 1-100)
 *   - `status` (string, optional): Filter by conversation status
 *   - `escalated` ("true"|"false", optional): Filter by escalation state
 *   - `priority` (string, optional): Filter by priority level
 * @returns 200 `{ conversations: ChatConversation[], total: number, page: number, limit: number, pages: number }`
 *   with `conversations` containing id, visitorId, name, email, phone, status, metadata, escalatedAt,
 *   priority, escalationReason, leadId, createdAt, updatedAt, and `_count.messages`
 * @throws 401 `{ error: "Unauthorized" }` when Clerk session is invalid or missing
 * @throws 403 `{ error: "Forbidden: Admin access required" }` when user lacks admin role
 * @throws 500 `{ error: "Failed to fetch chat conversations" }` on database errors
 * @see ChatConversation model in prisma/schema.prisma for field definitions
 * @see middleware.ts for rate limiting configuration (not applied to /api/admin/* routes)
 * @remarks Falls back to 401 when Clerk is not configured. Admin role checked via
 *   `currentUser().publicMetadata.role`. Conversations ordered by `updatedAt DESC`.
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
      logger.error("Clerk authentication error in admin chats", authError, {
        operation: "admin.chats.GET.auth",
      });
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
    const escalated = searchParams.get("escalated");
    const priority = searchParams.get("priority");

    // Calculate skip and take for Prisma
    const skip = (page - 1) * limit;
    const take = limit;

    // Build where clause for filtering
    const where: {
      status?: string;
      escalatedAt?: { not: null } | null;
      priority?: string;
    } = {};
    if (status) {
      where.status = status;
    }
    if (escalated === "true") {
      where.escalatedAt = { not: null };
    } else if (escalated === "false") {
      where.escalatedAt = null;
    }
    if (priority) {
      where.priority = priority;
    }

    // Get total count for pagination metadata
    const total = await prisma.chatConversation.count({ where });

    // Fetch paginated chat conversations
    const conversations = await prisma.chatConversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        visitorId: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        metadata: true,
        escalatedAt: true,
        priority: true,
        escalationReason: true,
        leadId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    // Calculate total pages
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      conversations,
      total,
      page,
      limit,
      pages
    });
  } catch (error) {
    logger.error("Admin chats API error", error, {
      operation: "admin.chats.GET",
    });
    return NextResponse.json({ error: "Failed to fetch chat conversations" }, { status: 500 });
  }
}
