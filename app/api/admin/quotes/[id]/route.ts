import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// Schema for quote request update — all fields optional so partial updates work.
// products and project* fields are not editable here.
const quoteUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  quantity: z.string().optional(),
  deliveryAddr: z.string().optional(),
  notes: z.string().optional(),
  status: z
    .enum(["pending", "contacted", "quoted", "accepted", "rejected"])
    .optional(),
});

/**
 * Admin quote request status update endpoint.
 *
 * @access admin
 * @param request - Incoming request with body validated against the local `quoteUpdateSchema`
 *   (status: "pending" | "reviewed" | "quoted" | "accepted" | "declined")
 * @param params - Next.js dynamic route params containing the quote request ID
 * @returns 200 `{ quote: QuoteRequest }` with updated quote request on success
 * @returns 404 `{ error: "Quote request not found" }` when quote ID doesn't exist
 * @throws 400 `{ error: "Invalid status value", details: ZodError[] }` when validation fails
 * @throws 403 `{ error: "Unauthorized: Admin access required" }` when admin auth fails
 * @throws 500 `{ error: "Failed to update quote request" }` on database or server errors
 * @see requireAdmin in lib/admin-auth.ts — Clerk-based admin role verification
 * @see quoteUpdateSchema — Zod schema enforcing valid status enum values
 * @remarks Status transitions are not enforced — any valid status can transition to any other.
 *   Future enhancement: add status transition rules (e.g., pending → reviewed → quoted).
 */
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

    const fields = validation.data;

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

    // Build update payload from provided fields only (partial update)
    const data: {
      name?: string;
      email?: string;
      phone?: string | null;
      company?: string | null;
      quantity?: string | null;
      deliveryAddr?: string | null;
      notes?: string | null;
      status?: string;
    } = {};
    if (fields.name !== undefined) data.name = fields.name;
    if (fields.email !== undefined) data.email = fields.email;
    if (fields.phone !== undefined) data.phone = fields.phone || null;
    if (fields.company !== undefined) data.company = fields.company || null;
    if (fields.quantity !== undefined) data.quantity = fields.quantity || null;
    if (fields.deliveryAddr !== undefined) data.deliveryAddr = fields.deliveryAddr || null;
    if (fields.notes !== undefined) data.notes = fields.notes || null;
    if (fields.status !== undefined) data.status = fields.status;

    // Update quote request
    const updatedQuote = await prisma.quoteRequest.update({
      where: { id },
      data,
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
