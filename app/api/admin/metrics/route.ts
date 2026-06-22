import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Admin dashboard metrics and KPI aggregation endpoint.
 *
 * @access admin
 * @returns 200 JSON object with comprehensive business metrics:
 *   - `orders`: { total, recent, revenue: { total, recent }, byStatus: Record<string, number> }
 *   - `leads`: { total, byStatus: Record<string, number> }
 *   - `contactSubmissions`: { total, byStatus: Record<string, number> }
 *   - `quoteRequests`: { total, byStatus: Record<string, number> }
 *   - `chatConversations`: { total, active }
 *   - `newsletterSubscribers`: { total, active }
 * @returns 401 `{ error: "Unauthorized" }` when Clerk is not configured or user is not authenticated
 * @returns 403 `{ error: "Forbidden: Admin access required" }` when authenticated user lacks admin role
 * @returns 500 `{ error: "Failed to fetch metrics" }` when database queries fail
 * @see middleware.ts — Clerk auth middleware wraps all /api/admin/* routes
 * @see prisma/schema.prisma — models referenced: Order, Lead, ContactSubmission, QuoteRequest, ChatConversation, NewsletterSubscriber
 * @remarks Authentication flow: Checks `auth()` session existence, then validates `currentUser().publicMetadata.role === "admin"`.
 *   Falls back to 401 when Clerk SDK is unconfigured (catch block on auth/currentUser calls).
 *   All metrics queries run in parallel via `Promise.all` for optimal performance.
 *   "Recent" metrics use a 30-day rolling window from current date.
 *   `byStatus` aggregations use Prisma `groupBy` to count records per status enum value.
 */
export async function GET() {
  try {
    // Check authentication and admin role
    let session;
    let user;

    try {
      session = await auth();
      user = await currentUser();
    } catch (authError) {
      logger.warn("Clerk authentication not configured in admin metrics", {
        operation: "admin.metrics.GET.auth",
        authError,
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

    // Calculate date for 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aggregate metrics in parallel
    const [
      // Order metrics
      totalOrders,
      recentOrders,
      totalRevenue,
      recentRevenue,
      ordersByStatus,

      // Lead metrics
      totalLeads,
      leadsByStatus,

      // Contact submission metrics
      totalContactSubmissions,
      contactSubmissionsByStatus,

      // Quote request metrics
      totalQuoteRequests,
      quoteRequestsByStatus,

      // Chat metrics
      totalChatConversations,
      activeChatConversations,

      // Newsletter metrics
      totalNewsletterSubscribers,
      activeNewsletterSubscribers,
    ] = await Promise.all([
      // Orders
      prisma.order.count(),
      prisma.order.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Leads
      prisma.lead.count(),
      prisma.lead.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Contact submissions
      prisma.contactSubmission.count(),
      prisma.contactSubmission.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Quote requests
      prisma.quoteRequest.count(),
      prisma.quoteRequest.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Chat conversations
      prisma.chatConversation.count(),
      prisma.chatConversation.count({
        where: { status: "active" },
      }),

      // Newsletter subscribers
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.count({
        where: { active: true },
      }),
    ]);

    // Format the response
    return NextResponse.json({
      orders: {
        total: totalOrders,
        recent: recentOrders,
        revenue: {
          total: totalRevenue._sum.total || 0,
          recent: recentRevenue._sum.total || 0,
        },
        byStatus: ordersByStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
      leads: {
        total: totalLeads,
        byStatus: leadsByStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
      contactSubmissions: {
        total: totalContactSubmissions,
        byStatus: contactSubmissionsByStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
      quoteRequests: {
        total: totalQuoteRequests,
        byStatus: quoteRequestsByStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
      chatConversations: {
        total: totalChatConversations,
        active: activeChatConversations,
      },
      newsletterSubscribers: {
        total: totalNewsletterSubscribers,
        active: activeNewsletterSubscribers,
      },
    });
  } catch (error) {
    logger.error("Admin metrics API error", error, {
      operation: "metrics.GET",
    });
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
