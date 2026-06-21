import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { chatEscalationSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import {
  createLeadFromConversation,
  getEscalationAcknowledgment
} from "@/lib/chat-escalation";
import { sendNotificationEmail } from "@/lib/email-service";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

/**
 * POST /api/chat/escalate
 *
 * Escalates a chat conversation to staff with lead creation and notification
 *
 * @rate-limit 5 requests per minute (chat tier)
 *
 * @request-body {chatEscalationSchema}
 * - visitorId: string - Visitor ID of the conversation to escalate (required)
 * - reason: enum - Reason for escalation: user_requested, cannot_answer, or high_intent (required)
 * - contactInfo?: object - Contact information for follow-up (optional)
 *   - name?: string - Customer name
 *   - email?: string - Customer email
 *   - phone?: string - Customer phone number
 *
 * @response 200 - Success
 * {
 *   success: true,
 *   message: string,
 *   leadId: string
 * }
 *
 * @response 400 - Validation error or conversation not found
 * { error: string, details?: ZodError[] }
 *
 * @response 404 - Conversation not found for the given visitorId
 * { error: string }
 *
 * @response 429 - Rate limit exceeded
 * { error: string, retryAfter: number }
 *
 * @response 500 - Database or server error
 * { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit (uses chat tier: 5 req/min)
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(identifier, "chat");

    logger.info("Chat escalation rate limit check", {
      identifier,
      success: rateLimitResult.success,
      remaining: rateLimitResult.remaining,
      limit: rateLimitResult.limit,
    });

    if (!rateLimitResult.success) {
      logger.warn("Chat escalation rate limit exceeded", {
        identifier,
        limit: rateLimitResult.limit,
        reset: rateLimitResult.reset,
      });

      const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const data = chatEscalationSchema.parse(body);

    // Find the conversation by visitorId
    const conversation = await prisma.chatConversation.findUnique({
      where: { visitorId: data.visitorId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      logger.warn("Conversation not found for escalation", {
        visitorId: data.visitorId,
      });
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Update conversation with contact info if provided
    if (data.contactInfo) {
      const { name, email, phone } = data.contactInfo;

      const updateData: {
        name?: string;
        email?: string;
        phone?: string;
      } = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;

      if (Object.keys(updateData).length > 0) {
        await prisma.chatConversation.update({
          where: { id: conversation.id },
          data: updateData,
        });

        logger.info("Updated conversation with contact info", {
          conversationId: conversation.id,
          hasName: !!name,
          hasEmail: !!email,
          hasPhone: !!phone,
        });
      }
    }

    // Create lead from conversation
    const result = await createLeadFromConversation(
      conversation.id,
      data.reason
    );

    if (!result) {
      logger.error("Failed to create lead from conversation", null, {
        conversationId: conversation.id,
        reason: data.reason,
      });
      return NextResponse.json(
        { error: "Failed to escalate conversation" },
        { status: 500 }
      );
    }

    const { leadId, priority } = result;

    // Send staff notification email (best effort - don't fail if email fails)
    const emailSubject = `Chat Escalation: ${data.reason} ${priority === "high" ? "🔴 HIGH PRIORITY" : ""}`;
    const emailBody = `
A chat conversation has been escalated and requires follow-up.

Lead ID: ${leadId}
Reason: ${data.reason}
Priority: ${priority}
Visitor ID: ${data.visitorId}

Contact Information:
Name: ${data.contactInfo?.name || conversation.name || "Not provided"}
Email: ${data.contactInfo?.email || conversation.email || "Not provided"}
Phone: ${data.contactInfo?.phone || conversation.phone || "Not provided"}

--- Chat Transcript ---
${conversation.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")}

---
View lead: ${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/leads/${leadId}
View conversation: ${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/chats/${conversation.id}
`;

    const emailResult = await sendNotificationEmail(
      emailSubject,
      emailBody,
      {
        tag: "lead-notification",
        metadata: {
          leadId,
          conversationId: conversation.id,
          reason: data.reason,
          priority,
        },
      }
    );

    if (!emailResult.success) {
      logger.warn("Failed to send escalation notification email", {
        leadId,
        conversationId: conversation.id,
        error: emailResult.error,
      });
      // Don't fail the request - email is best effort
    } else {
      logger.info("Escalation notification email sent", {
        leadId,
        conversationId: conversation.id,
        messageId: emailResult.messageId,
      });
    }

    // Get business hours-aware acknowledgment message
    const acknowledgmentMessage = getEscalationAcknowledgment();

    logger.info("Chat conversation escalated successfully", {
      conversationId: conversation.id,
      leadId,
      priority,
      reason: data.reason,
    });

    return NextResponse.json({
      success: true,
      message: acknowledgmentMessage,
      leadId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Chat escalation validation error", {
        errors: error.errors,
      });
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    logger.error("Chat escalation API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
