import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Fixed cost per SMS (Twilio US rate: ~$0.0075 per message)
const SMS_COST_PER_MESSAGE = 0.0075;

/**
 * GET /api/admin/sms-costs
 * Returns SMS cost reporting and usage statistics
 * Query params: startDate (optional), endDate (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (via Clerk metadata or environment variable)
    // For now, using a simple admin user ID check via env var
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(",") || [];
    if (!adminUserIds.includes(session.userId)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Build date filter
    const dateFilter: {
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (startDateParam || endDateParam) {
      dateFilter.createdAt = {};
      if (startDateParam) {
        dateFilter.createdAt.gte = new Date(startDateParam);
      }
      if (endDateParam) {
        // Set to end of day for inclusive date range
        const endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = endDate;
      }
    }

    // Query all SMS notifications with date filter
    const smsNotifications = await prisma.smsNotification.findMany({
      where: dateFilter,
      select: {
        id: true,
        status: true,
        sentAt: true,
        createdAt: true,
      },
    });

    // Calculate statistics
    const totalMessages = smsNotifications.length;
    const sentMessages = smsNotifications.filter(
      (sms) => sms.status === "sent" || sms.status === "delivered"
    ).length;
    const deliveredMessages = smsNotifications.filter(
      (sms) => sms.status === "delivered"
    ).length;
    const failedMessages = smsNotifications.filter(
      (sms) => sms.status === "failed"
    ).length;

    // Calculate costs (only count sent/delivered messages)
    const totalCost = sentMessages * SMS_COST_PER_MESSAGE;

    // Calculate delivery rate
    const deliveryRate = sentMessages > 0 ? (deliveredMessages / sentMessages) * 100 : 0;

    // Group by date for time series data
    const messagesByDate: Record<string, number> = {};
    smsNotifications.forEach((sms) => {
      const date = sms.createdAt.toISOString().split("T")[0];
      messagesByDate[date] = (messagesByDate[date] || 0) + 1;
    });

    // Group by status
    const messagesByStatus: Record<string, number> = {};
    smsNotifications.forEach((sms) => {
      messagesByStatus[sms.status] = (messagesByStatus[sms.status] || 0) + 1;
    });

    return NextResponse.json({
      summary: {
        totalMessages,
        sentMessages,
        deliveredMessages,
        failedMessages,
        totalCost: parseFloat(totalCost.toFixed(4)),
        deliveryRate: parseFloat(deliveryRate.toFixed(2)),
      },
      breakdown: {
        byDate: messagesByDate,
        byStatus: messagesByStatus,
      },
      dateRange: {
        start: startDateParam || "all time",
        end: endDateParam || "all time",
      },
    });
  } catch (error) {
    logger.error("SMS cost report error", error, {
      operation: "getSMSCosts",
    });
    return NextResponse.json(
      { error: "Failed to generate SMS cost report" },
      { status: 500 }
    );
  }
}
