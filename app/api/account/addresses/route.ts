import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { addressSchema, addressUpdateSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

/**
 * Fetch all saved addresses for the authenticated user.
 *
 * @access private
 * @param request - Incoming request (no body/query validation required)
 * @returns 200 `{ addresses: Address[] }` sorted by default flag (desc), then createdAt (desc)
 * @returns 401 `{ error: "Unauthorized" }` when Clerk session is missing
 * @throws 500 `{ error: "Failed to fetch addresses" }` on database errors
 * @see addressSchema in lib/schemas.ts — Address shape includes label, street, city, state, zip, isDefault
 * @see prisma/schema.prisma — Address model with userProfileId foreign key
 * @remarks Returns empty array when user has no profile (profile creation is lazy, triggered by POST).
 *   Default addresses sort first for UI convenience (pre-select default in forms).
 */
export async function GET(request: NextRequest) {
  let session;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.userId },
      include: {
        addresses: {
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' }
          ],
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ addresses: [] });
    }

    return NextResponse.json({ addresses: profile.addresses });
  } catch (error) {
    logger.error("Failed to fetch addresses", error, {
      userId: session?.userId,
    });
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

/**
 * Create a new address for the authenticated user.
 *
 * @access private
 * @param request - Incoming request with JSON body validated against `addressSchema`
 *   (label, street, city, state, zip, isDefault)
 * @returns 200 `{ address: Address }` with the newly created address
 * @returns 401 `{ error: "Unauthorized" }` when Clerk session is missing
 * @throws 400 `{ error: "Invalid data", details: ZodError[] }` when validation fails
 * @throws 500 `{ error: "Failed to create address" }` on database errors
 * @see addressSchema in lib/schemas.ts — includes string length limits, regex validation for zip/state
 * @see prisma/schema.prisma — Address model with unique constraint on (userProfileId, label) pair
 * @remarks **Default address logic**: If `isDefault: true`, atomically unsets `isDefault` on all
 *   other addresses for this user via `updateMany` before creating the new record. Ensures at most
 *   one default address per user. UserProfile is upserted (created if missing) to handle first-time
 *   address creation without requiring separate profile setup flow.
 */
export async function POST(request: NextRequest) {
  let session;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = addressSchema.parse(body);

    // Ensure profile exists
    const profile = await prisma.userProfile.upsert({
      where: { userId: session.userId },
      update: {},
      create: { userId: session.userId },
    });

    // If this is default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userProfileId: profile.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...data,
        userProfileId: profile.id,
      },
    });

    logger.info("Address created successfully", {
      userId: session.userId,
      addressId: address.id,
      isDefault: address.isDefault,
    });

    return NextResponse.json({ address });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Address creation validation failed", {
        userId: session?.userId,
        errors: error.errors,
      });
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    logger.error("Failed to create address", error, {
      userId: session?.userId,
    });
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
  }
}

/**
 * Update an existing address for the authenticated user.
 *
 * @access private
 * @param request - Incoming request with JSON body validated against `addressUpdateSchema`
 *   (id required; label, street, city, state, zip, isDefault optional)
 * @returns 200 `{ address: Address }` with the updated address
 * @returns 401 `{ error: "Unauthorized" }` when Clerk session is missing
 * @returns 404 `{ error: "Profile not found" }` when user has no profile (should not happen in practice)
 * @returns 404 `{ error: "Address not found" }` when address ID doesn't exist or doesn't belong to user
 * @throws 400 `{ error: "Invalid data", details: ZodError[] }` when validation fails
 * @throws 500 `{ error: "Failed to update address" }` on database errors
 * @see addressUpdateSchema in lib/schemas.ts — partial update schema with required id field
 * @see prisma/schema.prisma — Address.userProfileId enforces ownership boundary
 * @remarks **Ownership validation**: Queries `findFirst` with both address ID and userProfileId to
 *   prevent horizontal privilege escalation (users editing other users' addresses). **Default address
 *   logic**: If `isDefault: true`, atomically unsets `isDefault` on all other addresses for this user
 *   (excluding current address ID) before applying the update. Partial updates are supported — only
 *   fields present in the request body are modified.
 */
export async function PUT(request: NextRequest) {
  let session;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = addressUpdateSchema.parse(body);

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { id: data.id, userProfileId: profile.id },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userProfileId: profile.id, id: { not: data.id } },
        data: { isDefault: false },
      });
    }

    const { id, ...updateData } = data;
    const address = await prisma.address.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ address });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    logger.error("Failed to update address", error, {
      userId: session?.userId,
    });
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

/**
 * Delete an address for the authenticated user.
 *
 * @access private
 * @param request - Incoming request with query param `?id=<addressId>` (no body validation)
 * @returns 200 `{ success: true }` on successful deletion
 * @returns 401 `{ error: "Unauthorized" }` when Clerk session is missing
 * @returns 400 `{ error: "Address ID required" }` when id query param is missing
 * @returns 404 `{ error: "Profile not found" }` when user has no profile
 * @throws 500 `{ error: "Failed to delete address" }` on database errors
 * @see prisma/schema.prisma — Address.userProfileId enforces ownership boundary
 * @remarks **Ownership validation**: Uses `deleteMany` with both address ID and userProfileId filter
 *   to prevent horizontal privilege escalation (users deleting other users' addresses). If the address
 *   doesn't exist or doesn't belong to the user, the operation silently succeeds (deleteMany returns 0
 *   affected rows but doesn't throw). This is idempotent and safe — no 404 distinction between
 *   "doesn't exist" and "not yours" prevents enumeration attacks.
 */
export async function DELETE(request: NextRequest) {
  let session;
  let addressId;
  try {
    session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    addressId = searchParams.get("id");
    if (!addressId) {
      return NextResponse.json({ error: "Address ID required" }, { status: 400 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    await prisma.address.deleteMany({
      where: { id: addressId, userProfileId: profile.id },
    });

    logger.info("Address deleted successfully", {
      userId: session.userId,
      addressId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete address", error, {
      userId: session?.userId,
      addressId,
    });
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
