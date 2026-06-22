import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { sendTransactionalEmail } from "@/lib/email-service";
import { sendSMS } from "@/lib/sms";
import { logger } from "@/lib/logger";

// Schema for staff reply
const replySchema = z.object({
  replyMessage: z.string().min(1, "Reply message is required"),
  method: z.enum(["email", "sms"]),
});

/**
 * POST /api/admin/chats/[id]/reply
 * Sends a staff reply via email or SMS and appends it to the conversation
 * Requires admin authentication
 * Request body: { replyMessage: string, method: "email" | "sms" }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdmin();

    // Await params (Next.js 15)
    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = replySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { replyMessage, method } = validation.data;

    // Check if conversation exists and get contact info
    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        status: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Send via appropriate method
    let sendResult: { success: boolean; error?: string; messageId?: string };

    if (method === "email") {
      if (!conversation.email) {
        return NextResponse.json(
          { error: "No email address available for this conversation" },
          { status: 400 }
        );
      }

      sendResult = await sendTransactionalEmail(
        conversation.email,
        "Response from Muskingum Materials",
        replyMessage,
        {
          tag: "chat-reply",
          metadata: {
            conversationId: conversation.id,
            method: "email",
          },
        }
      );
    } else {
      // method === "sms"
      if (!conversation.phone) {
        return NextResponse.json(
          { error: "No phone number available for this conversation" },
          { status: 400 }
        );
      }

      sendResult = await sendSMS({
        to: conversation.phone,
        message: replyMessage,
        email: conversation.email || undefined,
      });
    }

    if (!sendResult.success) {
      logger.error("Failed to send staff reply", new Error(sendResult.error || "Unknown error"), {
        conversationId: conversation.id,
        method,
        error: sendResult.error,
      });

      return NextResponse.json(
        { error: `Failed to send ${method}: ${sendResult.error}` },
        { status: 500 }
      );
    }

    // Append reply as assistant message to conversation
    const message = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: replyMessage,
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      method,
      messageId: sendResult.messageId,
      message,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    logger.error("Failed to process staff reply", error, {
      conversationId: (await params).id,
    });

    return NextResponse.json(
      { error: "Failed to process reply" },
      { status: 500 }
    );
  }
}
