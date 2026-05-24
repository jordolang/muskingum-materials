import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public read-only endpoint exposing the active product catalog. Used by
// client components (recurring orders form, future widgets) that can't run
// Prisma directly. Runs per-request so price edits show up immediately, and
// degrades to an empty list when the DB is unreachable (e.g. preview builds
// without DATABASE_URL).
export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        shortDescription: true,
        price: true,
        unit: true,
        imageUrl: true,
        imageAlt: true,
      },
    });
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ products: [] });
  }
}
