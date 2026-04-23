import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const recurringOrder = await prisma.recurringOrder.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!recurringOrder) {
      return NextResponse.json({ error: "Recurring order not found" }, { status: 404 });
    }

    return NextResponse.json({ recurringOrder });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch recurring order" }, { status: 500 });
  }
}
