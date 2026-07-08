import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// Schema for lead update — all fields optional so partial updates work
const leadUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  message: z.string().optional(),
  source: z.string().max(100).optional(),
  status: z
    .enum(["new", "contacted", "qualified", "converted", "closed"])
    .optional(),
});

/**
 * Admin-only lead status update endpoint.
 *
 * @access admin
 * @param request - Incoming request with body validated against `leadUpdateSchema`
 *   (status: "new" | "contacted" | "qualified" | "converted" | "closed")
 * @param params - Route parameters containing lead ID
 * @returns 200 `{ lead: Lead }` with updated lead record on success
 * @returns 400 `{ error: string, details: ZodError[] }` when status validation fails
 * @returns 403 `{ error: string }` when admin authentication fails
 * @returns 404 `{ error: string }` when lead ID is not found
 * @returns 500 `{ error: string }` on database or server errors
 * @see requireAdmin in lib/admin-auth.ts for authentication implementation
 * @remarks Lead status transitions track the sales pipeline from initial contact through
 *   conversion. All status updates are logged with timestamps via Prisma's updatedAt.
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
    const validation = leadUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid status value", details: validation.error.errors },
        { status: 400 }
      );
    }

    const fields = validation.data;

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Build update payload from provided fields only (partial update)
    const data: {
      name?: string;
      email?: string;
      phone?: string | null;
      company?: string | null;
      message?: string | null;
      source?: string;
      status?: string;
    } = {};
    if (fields.name !== undefined) data.name = fields.name;
    if (fields.email !== undefined) data.email = fields.email;
    if (fields.phone !== undefined) data.phone = fields.phone || null;
    if (fields.company !== undefined) data.company = fields.company || null;
    if (fields.message !== undefined) data.message = fields.message || null;
    if (fields.source !== undefined) data.source = fields.source;
    if (fields.status !== undefined) data.status = fields.status;

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        message: true,
        source: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ lead: updatedLead });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}
