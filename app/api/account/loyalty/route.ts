import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.loyaltyAccount.findUnique({
      where: { userId: session.userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Loyalty account fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch loyalty account" }, { status: 500 });
  }
}
