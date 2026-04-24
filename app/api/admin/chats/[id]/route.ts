import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// Schema for chat conversation status update
const chatUpdateSchema = z.object({
  status: z.enum(["active", "closed", "archived"]),
});

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
