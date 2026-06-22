import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// Schema for chat conversation status update
const chatUpdateSchema = z.object({
  status: z.enum(["active", "closed", "archived"]),
});

/**
 * Fetch full chat conversation details with all messages.
 *
 * @access admin
 * @param request - Incoming request (authentication validated via requireAdmin)
 * @param params - Route params containing conversation `id`
 * @returns 200 `{ conversation: ChatConversation }` with full conversation object including messages array (ordered by createdAt ASC)
 * @returns 403 `{ error: "Unauthorized: Admin access required" }` when authentication fails
 * @returns 404 `{ error: "Chat conversation not found" }` when conversation ID doesn't exist
 * @returns 500 `{ error: "Failed to fetch chat conversation" }` on unexpected errors
 * @see requireAdmin in lib/admin-auth.ts — Clerk-based admin authentication guard
 * @see ChatConversation schema in prisma/schema.prisma
 * @remarks Returns complete conversation object with nested messages. Messages are ordered chronologically.
 *   Used by admin dashboard to view customer support chat history and context.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdmin();

    const { id } = await params;

    // Fetch chat conversation with all messages
    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
      select: {
        id: true,
        visitorId: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Chat conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch chat conversation" },
      { status: 500 }
    );
  }
}

/**
 * Update chat conversation status.
 *
 * @access admin
 * @param request - Incoming request with body validated against local `chatUpdateSchema`
 *   (status: "active" | "closed" | "archived")
 * @param params - Route params containing conversation `id`
 * @returns 200 `{ conversation: ChatConversation }` with updated conversation object including messages
 * @returns 400 `{ error: "Invalid status value", details: ZodError[] }` when validation fails
 * @returns 403 `{ error: "Unauthorized: Admin access required" }` when authentication fails
 * @returns 404 `{ error: "Chat conversation not found" }` when conversation ID doesn't exist
 * @returns 500 `{ error: "Failed to update chat conversation" }` on unexpected errors
 * @throws 400 when request body doesn't match `chatUpdateSchema` (status must be "active", "closed", or "archived")
 * @see requireAdmin in lib/admin-auth.ts — Clerk-based admin authentication guard
 * @see chatUpdateSchema — local schema enforcing status enum constraint
 * @see ChatConversation schema in prisma/schema.prisma
 * @remarks Used by admin dashboard to manage conversation lifecycle (triage active chats, close resolved ones, archive old ones).
 *   Returns full updated conversation object for immediate UI refresh.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdmin();

    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = chatUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid status value", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    // Check if conversation exists
    const existingConversation = await prisma.chatConversation.findUnique({
      where: { id },
    });

    if (!existingConversation) {
      return NextResponse.json(
        { error: "Chat conversation not found" },
        { status: 404 }
      );
    }

    // Update conversation status
    const updatedConversation = await prisma.chatConversation.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        visitorId: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ conversation: updatedConversation });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update chat conversation" },
      { status: 500 }
    );
  }
}
