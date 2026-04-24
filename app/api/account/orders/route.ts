import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

    // Calculate skip and take for Prisma
    const skip = (page - 1) * limit;
    const take = limit;

    // Get total count for pagination metadata
    const total = await prisma.order.count({
      where: { userId: session.userId },
    });

    // Fetch paginated orders
    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        orderNumber: true,
        items: true,
        subtotal: true,
        tax: true,
        processingFee: true,
        deliveryFee: true,
        total: true,
        pickupOrDeliver: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    // Calculate total pages
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      pages
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
