import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendMarketingEmail } from "@/lib/email-service";

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
 * POST /api/admin/campaigns/[id]/send
 * Sends a campaign to all active newsletter subscribers
 * Requires: Admin authentication (Clerk role: admin)
 * Params: id (campaign ID)
 * Process:
 *   1. Validates campaign exists and is not already sent/sending
 *   2. Fetches all active newsletter subscribers
 *   3. Updates campaign status to "sending"
 *   4. Sends personalized emails with unsubscribe URLs
 *   5. Updates campaign with delivery metrics (success/failure counts)
 * Restrictions: Cannot send campaigns with status "sent" or "sending"
 * Returns: Campaign with send results (totalRecipients, successCount, failureCount, status)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const { id } = await params;

    // Fetch campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Prevent sending already sent campaigns
    if (campaign.status === "sent") {
      return NextResponse.json(
        { error: "Campaign has already been sent" },
        { status: 400 }
      );
    }

    // Prevent sending campaigns that are currently being sent
    if (campaign.status === "sending") {
      return NextResponse.json(
        { error: "Campaign is already being sent" },
        { status: 400 }
      );
    }

    // Get all active newsletter subscribers
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { active: true },
      select: { email: true, name: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "No active subscribers found" },
        { status: 400 }
      );
    }

    // Update campaign status to sending
    await prisma.campaign.update({
      where: { id },
      data: { status: "sending" },
    });

    // Send emails to all subscribers
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const subscriber of subscribers) {
      try {
        // Build unsubscribe URL for this specific subscriber
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

        // Replace {{unsubscribe_url}} placeholder in both HTML and text content
        const htmlWithUnsubscribe = campaign.htmlContent.replace(
          /\{\{unsubscribe_url\}\}/g,
          unsubscribeUrl
        );
        const textWithUnsubscribe = (campaign.textContent || "").replace(
          /\{\{unsubscribe_url\}\}/g,
          unsubscribeUrl
        );

        // Send email with processed content
        const result = await sendMarketingEmail(
          subscriber.email,
          campaign.subject,
          textWithUnsubscribe || htmlWithUnsubscribe.replace(/<[^>]*>/g, ""), // Use processed text or strip HTML from processed HTML
          htmlWithUnsubscribe,
          {
            campaignId: campaign.id,
            tag: "newsletter-broadcast",
            metadata: {
              campaignName: campaign.name,
              subscriberName: subscriber.name || "Subscriber",
            },
          }
        );

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          errors.push(`${subscriber.email}: ${result.error}`);
        }
      } catch (error) {
        failureCount++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push(`${subscriber.email}: ${errorMessage}`);
        logger.error("Failed to send campaign email", error, {
          campaignId: campaign.id,
          recipientEmail: subscriber.email,
        });
      }
    }

    // Update campaign with results
    const metrics = {
      totalRecipients: subscribers.length,
      successCount,
      failureCount,
      errors: errors.slice(0, 100), // Limit stored errors to prevent excessive data
    };

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: failureCount === subscribers.length ? "failed" : "sent",
        sentAt: new Date(),
        recipientCount: subscribers.length,
        metrics,
      },
    });

    // Log final result
    if (failureCount > 0) {
      logger.error("Campaign sent with some failures", null, {
        campaignId: campaign.id,
        successCount,
        failureCount,
      });
    }

    return NextResponse.json({
      campaign: updatedCampaign,
      result: {
        totalRecipients: subscribers.length,
        successCount,
        failureCount,
        status: updatedCampaign.status,
      },
    });
  } catch (error) {
    logger.error("Failed to send campaign", error, {
      operation: "campaign.send",
    });

    // Try to update campaign status to failed
    try {
      const { id } = await params;
      await prisma.campaign.update({
        where: { id },
        data: { status: "failed" },
      });
    } catch (updateError) {
      logger.error("Failed to update campaign status to failed", updateError);
    }

    return NextResponse.json(
      { error: "Failed to send campaign" },
      { status: 500 }
    );
  }
}
