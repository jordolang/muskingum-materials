import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// Schema for subscriber update — name and active editable; all optional for partial updates.
const subscriberUpdateSchema = z.object({
  name: z.string().max(200).optional(),
  active: z.boolean().optional(),
});

/**
 * Admin-only newsletter subscriber update endpoint.
 *
 * @access admin
 * @param request - Incoming request with body validated against `subscriberUpdateSchema`
 *   (name and/or active — both optional)
 * @param params - Route parameters containing subscriber ID
 * @returns 200 `{ subscriber: NewsletterSubscriber }` with the updated record on success
 * @returns 400 `{ error: string, details: ZodError[] }` when validation fails
 * @returns 403 `{ error: string }` when admin authentication fails
 * @returns 404 `{ error: string }` when subscriber ID is not found
 * @returns 500 `{ error: string }` on database or server errors
 * @see requireAdmin in lib/admin-auth.ts for authentication implementation
 */
export async function PATCH(
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
    const validation = subscriberUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const fields = validation.data;

    // Check if subscriber exists
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 }
      );
    }

    // Build update payload from provided fields only (partial update)
    const data: { name?: string | null; active?: boolean } = {};
    if (fields.name !== undefined) data.name = fields.name || null;
    if (fields.active !== undefined) data.active = fields.active;

    const updated = await prisma.newsletterSubscriber.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ subscriber: updated });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update subscriber" },
      { status: 500 }
    );
  }
}
