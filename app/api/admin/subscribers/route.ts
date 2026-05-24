import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function checkAdminAuth() {
  const user = await currentUser();
  if (!user) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const isAdmin = user.publicMetadata?.role === "admin";
  if (!isAdmin) {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { authorized: true, user };
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

    // Handle active filter
    const activeParam = searchParams.get("active");
    const where: { active?: boolean } = {};
    if (activeParam !== null) {
      where.active = activeParam === "true";
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const total = await prisma.newsletterSubscriber.count({ where });

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        createdAt: true,
      },
    });

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      subscribers,
      total,
      page,
      limit,
      pages,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}
