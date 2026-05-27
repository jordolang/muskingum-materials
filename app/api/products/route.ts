import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/products
 * Returns the public product catalog with all active products
 * Public read-only endpoint used by client components (recurring orders form, future widgets)
 * that can't run Prisma directly. Runs per-request so price edits show up immediately.
 * Degrades gracefully to empty list when DATABASE_URL is unavailable.
 *
 * Query params: None
 *
 * Response shape: {
 *   products: Array<{
 *     id: string,
 *     slug: string,
 *     name: string,
 *     category: string,
 *     shortDescription: string,
 *     price: number,
 *     unit: string,
 *     imageUrl: string | null,
 *     imageAlt: string | null
 *   }>
 * }
 */
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
