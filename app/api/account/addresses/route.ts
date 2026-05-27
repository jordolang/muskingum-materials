import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { addressSchema, addressUpdateSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

/**
 * GET /api/account/addresses
 * Returns all saved addresses for the authenticated user
 * Requires: User authentication via Clerk
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
 * POST /api/account/addresses
 * Creates a new address for the authenticated user
 * Requires: User authentication via Clerk
 * Body: addressSchema (label, street, city, state, zip, isDefault)
 * Handles default address logic (unsets other defaults if isDefault=true)
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
 * PUT /api/account/addresses
 * Updates an existing address for the authenticated user
 * Requires: User authentication via Clerk
 * Body: addressUpdateSchema (id required, other fields optional)
 * Validates address ownership before updating
 * Handles default address logic (unsets other defaults if isDefault=true)
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
 * DELETE /api/account/addresses
 * Deletes an address for the authenticated user
 * Requires: User authentication via Clerk
 * Query params: id (required) - Address ID to delete
 * Validates address ownership before deletion
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
