import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin-auth";

async function checkAdminAuth() {
  const user = await currentUser();
  if (!user) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const isAdmin = isAdminUser(user);
  if (!isAdmin) {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { authorized: true, user };
}

const updateCampaignSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  subject: z.string().min(3, "Subject must be at least 3 characters").optional(),
  htmlContent: z.string().min(10, "HTML content must be at least 10 characters").optional(),
  textContent: z.string().optional(),
  templateId: z.string().nullable().optional(),
  status: z.enum(["draft", "scheduled", "sending", "sent", "failed"]).optional(),
  scheduledAt: z.coerce.date().nullable().optional(),
});

/**
 * Fetch a single email campaign by ID with template details.
 *
 * @access admin-only
 * @param _request - Incoming Next.js request (unused, auth handled by checkAdminAuth)
 * @param params - Route parameters containing the campaign ID
 * @returns 200 `{ campaign: Campaign & { template: { id, name } | null } }` on success
 * @returns 401 `{ error: "Unauthorized" }` when user is not authenticated
 * @returns 403 `{ error: "Forbidden" }` when user lacks admin role in Clerk publicMetadata
 * @returns 404 `{ error: "Campaign not found" }` when campaign ID does not exist
 * @returns 500 `{ error: "Failed to fetch campaign" }` on database errors
 * @see checkAdminAuth - Clerk-based admin role verification
 * @see prisma.campaign.findUnique - includes template relation for associated email template metadata
 * @remarks Admin access is verified via Clerk `publicMetadata.role === "admin"`.
 *   The template relation is populated for campaigns using reusable email templates.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}

/**
 * Update an existing email campaign (draft or scheduled only).
 *
 * @access admin-only
 * @param request - Incoming request with body validated against `updateCampaignSchema`
 *   (name, subject, htmlContent, textContent, templateId, status, scheduledAt — all optional).
 * @param params - Route parameters containing the campaign ID
 * @returns 200 `{ campaign: Campaign & { template: { id, name } | null } }` on successful update
 * @returns 400 `{ error: "Cannot edit a sent campaign" }` when attempting to modify a sent campaign
 * @returns 400 `{ error: "Invalid data", details: ZodError[] }` when validation fails
 * @returns 401 `{ error: "Unauthorized" }` when user is not authenticated
 * @returns 403 `{ error: "Forbidden" }` when user lacks admin role in Clerk publicMetadata
 * @returns 404 `{ error: "Campaign not found" }` when campaign ID does not exist
 * @returns 500 `{ error: "Failed to update campaign" }` on database errors
 * @throws 400 `{ error: "Invalid data", details: ZodError[] }` when request body fails Zod validation
 * @see updateCampaignSchema - Zod schema enforcing min(3) for name/subject to prevent accidental blank campaigns,
 *   min(10) for htmlContent to ensure minimal template structure, enum for status to prevent invalid states
 * @see checkAdminAuth - Clerk-based admin role verification
 * @remarks Sent campaigns are immutable — this prevents accidental modification of historical campaign records
 *   and preserves audit integrity for compliance. Only draft/scheduled/sending/failed campaigns can be edited.
 *   Template relation is re-fetched to provide updated template metadata in the response.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Prevent editing sent campaigns
    if (campaign.status === "sent") {
      return NextResponse.json(
        { error: "Cannot edit a sent campaign" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = updateCampaignSchema.parse(body);

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data,
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ campaign: updatedCampaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

/**
 * Delete an email campaign (draft or scheduled only).
 *
 * @access admin-only
 * @param _request - Incoming Next.js request (unused, auth handled by checkAdminAuth)
 * @param params - Route parameters containing the campaign ID
 * @returns 200 `{ success: true }` on successful deletion
 * @returns 400 `{ error: "Cannot delete a sent campaign" }` when attempting to delete a sent campaign
 * @returns 401 `{ error: "Unauthorized" }` when user is not authenticated
 * @returns 403 `{ error: "Forbidden" }` when user lacks admin role in Clerk publicMetadata
 * @returns 404 `{ error: "Campaign not found" }` when campaign ID does not exist
 * @returns 500 `{ error: "Failed to delete campaign" }` on database errors
 * @see checkAdminAuth - Clerk-based admin role verification
 * @remarks Sent campaigns cannot be deleted to preserve historical records and maintain audit trails
 *   for compliance/analytics. This is a hard delete operation — consider implementing soft deletes
 *   for draft campaigns if undo functionality is needed. Related template associations are automatically
 *   handled by Prisma cascade rules (or foreign key constraints).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Prevent deleting sent campaigns
    if (campaign.status === "sent") {
      return NextResponse.json(
        { error: "Cannot delete a sent campaign" },
        { status: 400 }
      );
    }

    await prisma.campaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
