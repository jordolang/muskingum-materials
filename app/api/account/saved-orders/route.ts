import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const savedOrders = await prisma.savedOrder.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        name: true,
        items: true,
        deliveryAddress: true,
        pickupOrDeliver: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ savedOrders });
  } catch (error) {
    console.error("Saved orders fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch saved orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, items, deliveryAddress, pickupOrDeliver } = body;

    if (!name || !items) {
      return NextResponse.json(
        { error: "Name and items are required" },
        { status: 400 }
      );
    }

    const savedOrder = await prisma.savedOrder.create({
      data: {
        userId: session.userId,
        name,
        items,
        deliveryAddress: deliveryAddress || null,
        pickupOrDeliver: pickupOrDeliver || "pickup",
      },
    });

    return NextResponse.json({ savedOrder }, { status: 201 });
  } catch (error) {
    console.error("Saved order creation error:", error);
    return NextResponse.json({ error: "Failed to create saved order" }, { status: 500 });
  }
}
