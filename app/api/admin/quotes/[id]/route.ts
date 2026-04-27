import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// Schema for quote request status update
const quoteUpdateSchema = z.object({
  status: z.enum(["pending", "reviewed", "quoted", "accepted", "declined"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdmin();

    // Await params (Next.js 15+)
    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = quoteUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid status value", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    // Check if quote request exists
    const existingQuote = await prisma.quoteRequest.findUnique({
      where: { id },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: "Quote request not found" },
        { status: 404 }
      );
    }

    // Update quote request status
    const updatedQuote = await prisma.quoteRequest.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        products: true,
        quantity: true,
        deliveryAddr: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ quote: updatedQuote });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update quote request" },
      { status: 500 }
    );
  }
}
